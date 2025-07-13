import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Invoice } from '../entity/Invoice';
import { InvoiceLineItem } from '../entity/InvoiceLineItem';
import { Customer } from '../entity/Customer';

export class InvoiceService {
  constructor(
    private invoiceRepo: Repository<Invoice>,
    private lineItemRepo: Repository<InvoiceLineItem>,
    private customerRepo: Repository<Customer>
  ) {}

  async findAll(): Promise<Invoice[]> {
    try {
      return await this.invoiceRepo.find({
        relations: ['customer', 'lineItems'],
        order: { invoiceDate: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: number): Promise<Invoice | null> {
    try {
      return await this.invoiceRepo.findOne({
        where: { id },
        relations: ['customer', 'lineItems']
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoice with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    try {
      return await this.invoiceRepo.findOne({
        where: { invoiceNumber },
        relations: ['customer', 'lineItems']
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoice with number ${invoiceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByCustomerId(customerId: number): Promise<Invoice[]> {
    try {
      return await this.invoiceRepo.find({
        where: { customer: { id: customerId } },
        relations: ['customer', 'lineItems'],
        order: { invoiceDate: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoices for customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async create(invoiceData: Partial<Invoice>, lineItems: Partial<InvoiceLineItem>[] = []): Promise<Invoice> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!invoiceData.invoiceNumber) {
        throw new Error('Invoice number is required');
      }
      if (!invoiceData.customer?.id) {
        throw new Error('Customer is required');
      }

      const existingInvoice = await this.findByInvoiceNumber(invoiceData.invoiceNumber);
      if (existingInvoice) {
        throw new Error(`Invoice with number ${invoiceData.invoiceNumber} already exists`);
      }

      const customer = await this.customerRepo.findOne({
        where: { id: invoiceData.customer.id }
      });
      if (!customer) {
        throw new Error(`Customer with ID ${invoiceData.customer.id} not found`);
      }

      const invoice = this.invoiceRepo.create({
        ...invoiceData,
        customer
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      if (lineItems.length > 0) {
        const createdLineItems = lineItems.map(lineItemData => 
          this.lineItemRepo.create({
            ...lineItemData,
            invoice: savedInvoice
          })
        );

        await queryRunner.manager.save(createdLineItems);
        savedInvoice.lineItems = createdLineItems;
      }

      await this.updateInvoiceTotal(savedInvoice.id, queryRunner.manager);

      await queryRunner.commitTransaction();

      return await this.findById(savedInvoice.id) as Invoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, updateData: Partial<Invoice>): Promise<Invoice> {
    try {
      const existingInvoice = await this.findById(id);
      if (!existingInvoice) {
        throw new Error(`Invoice with ID ${id} not found`);
      }

      if (updateData.invoiceNumber && updateData.invoiceNumber !== existingInvoice.invoiceNumber) {
        const invoiceWithSameNumber = await this.findByInvoiceNumber(updateData.invoiceNumber);
        if (invoiceWithSameNumber) {
          throw new Error(`Invoice with number ${updateData.invoiceNumber} already exists`);
        }
      }

      await this.invoiceRepo.update(id, updateData);
      const updatedInvoice = await this.findById(id);
      
      if (!updatedInvoice) {
        throw new Error(`Failed to retrieve updated invoice with ID ${id}`);
      }

      return updatedInvoice;
    } catch (error) {
      throw new Error(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: number): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingInvoice = await this.findById(id);
      if (!existingInvoice) {
        throw new Error(`Invoice with ID ${id} not found`);
      }

      await queryRunner.manager.delete(InvoiceLineItem, { invoice: { id } });
      await queryRunner.manager.delete(Invoice, id);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await queryRunner.release();
    }
  }

  async addLineItem(invoiceId: number, lineItemData: Partial<InvoiceLineItem>): Promise<InvoiceLineItem> {
    try {
      const invoice = await this.findById(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice with ID ${invoiceId} not found`);
      }

      const lineItem = this.lineItemRepo.create({
        ...lineItemData,
        invoice
      });

      const savedLineItem = await this.lineItemRepo.save(lineItem);
      await this.updateInvoiceTotal(invoiceId);

      return savedLineItem;
    } catch (error) {
      throw new Error(`Failed to add line item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateLineItem(lineItemId: number, updateData: Partial<InvoiceLineItem>): Promise<InvoiceLineItem> {
    try {
      const existingLineItem = await this.lineItemRepo.findOne({
        where: { id: lineItemId },
        relations: ['invoice']
      });
      
      if (!existingLineItem) {
        throw new Error(`Line item with ID ${lineItemId} not found`);
      }

      await this.lineItemRepo.update(lineItemId, updateData);
      await this.updateInvoiceTotal(existingLineItem.invoice.id);

      const updatedLineItem = await this.lineItemRepo.findOne({
        where: { id: lineItemId },
        relations: ['invoice']
      });

      if (!updatedLineItem) {
        throw new Error(`Failed to retrieve updated line item with ID ${lineItemId}`);
      }

      return updatedLineItem;
    } catch (error) {
      throw new Error(`Failed to update line item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeLineItem(lineItemId: number): Promise<void> {
    try {
      const existingLineItem = await this.lineItemRepo.findOne({
        where: { id: lineItemId },
        relations: ['invoice']
      });
      
      if (!existingLineItem) {
        throw new Error(`Line item with ID ${lineItemId} not found`);
      }

      const invoiceId = existingLineItem.invoice.id;
      await this.lineItemRepo.delete(lineItemId);
      await this.updateInvoiceTotal(invoiceId);
    } catch (error) {
      throw new Error(`Failed to remove line item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateInvoiceTotal(invoiceId: number, manager?: any): Promise<void> {
    try {
      const repo = manager || this.invoiceRepo;
      const lineItemRepo = manager || this.lineItemRepo;

      const lineItems = await lineItemRepo.find({
        where: { invoice: { id: invoiceId } }
      });

      const total = lineItems.reduce((sum, item) => sum + (item.unitTotal || 0), 0);

      await repo.update(invoiceId, { total });
    } catch (error) {
      throw new Error(`Failed to update invoice total: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInvoicesByStatus(draft: boolean = false, canceled: boolean = false, billed: boolean = false): Promise<Invoice[]> {
    try {
      return await this.invoiceRepo.find({
        where: { draft, canceled, billed },
        relations: ['customer', 'lineItems'],
        order: { invoiceDate: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoices by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markAsBilled(id: number): Promise<Invoice> {
    try {
      return await this.update(id, { billed: true, draft: false });
    } catch (error) {
      throw new Error(`Failed to mark invoice as billed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markAsCanceled(id: number): Promise<Invoice> {
    try {
      return await this.update(id, { canceled: true });
    } catch (error) {
      throw new Error(`Failed to mark invoice as canceled: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}