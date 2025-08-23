import {Repository} from 'typeorm';
import {AppDataSource} from '../data-source';
import {Invoice} from '../entity/Invoice';
import {InvoiceLineItem} from '../entity/InvoiceLineItem';
import {Customer} from '../entity/Customer';

export class InvoiceService {
  constructor(
    private invoiceRepo: Repository<Invoice>,
    private lineItemRepo: Repository<InvoiceLineItem>,
    private customerRepo: Repository<Customer>
  ) {
  }

  async findAll(): Promise<Invoice[]> {
    try {
      return await this.invoiceRepo.find({
        relations: ['customer', 'lineItems'],
        order: {invoiceDate: 'DESC'}
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<Invoice | null> {
    try {
      return await this.invoiceRepo.findOne({
        where: {_id: id},
        relations: ['customer', 'lineItems']
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoice with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    try {
      return await this.invoiceRepo.findOne({
        where: {invoiceNumber},
        relations: ['customer', 'lineItems']
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoice with number ${invoiceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByCustomerId(customerId: string): Promise<Invoice[]> {
    try {
      return await this.invoiceRepo.find({
        where: {_customerId: customerId},
        relations: ['customer', 'lineItems'],
        order: {invoiceDate: 'DESC'}
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
      if (!invoiceData._customerId) {
        throw new Error('Customer ID is required');
      }

      const existingInvoice = await this.findByInvoiceNumber(invoiceData.invoiceNumber);
      if (existingInvoice) {
        throw new Error(`Invoice with number ${invoiceData.invoiceNumber} already exists`);
      }

      const customer = await this.customerRepo.findOne({
        where: {_id: invoiceData._customerId}
      });
      if (!customer) {
        throw new Error(`Customer with ID ${invoiceData._customerId} not found`);
      }

      const invoice = this.invoiceRepo.create({
        ...invoiceData,
        _customerId: invoiceData._customerId,
        customer
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      if (lineItems.length > 0) {
        const createdLineItems = lineItems.map(lineItemData =>
          this.lineItemRepo.create({
            ...lineItemData,
            _invoiceId: savedInvoice._id,
            invoice: savedInvoice
          })
        );

        await queryRunner.manager.save(createdLineItems);
        savedInvoice.lineItems = createdLineItems;
      }

      await queryRunner.commitTransaction();

      // Update total after transaction is committed
      if (lineItems.length > 0) {
        await this.updateInvoiceTotal(savedInvoice._id);
      }

      return await this.findById(savedInvoice._id) as Invoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateData: Partial<Invoice>): Promise<Invoice> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

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

      // Filter out relation fields that shouldn't be updated directly
      const {customer, lineItems, ...dataToUpdate} = updateData;

      // Update invoice data
      await queryRunner.manager.update('Invoice', {_id: id}, dataToUpdate);

      // Handle line items only if explicitly provided and valid
      if (lineItems !== undefined && Array.isArray(lineItems)) {
        // Remove existing line items
        await queryRunner.manager.delete('InvoiceLineItem', {_invoiceId: id});

        // Add new line items if any
        if (lineItems.length > 0) {
          const newLineItems = lineItems.map(lineItemData =>
            this.lineItemRepo.create({
              ...lineItemData,
              _invoiceId: id
            })
          );
          await queryRunner.manager.save(newLineItems);
        }

        // Update total after line items change
        await queryRunner.commitTransaction();
        await this.updateInvoiceTotal(id);
      } else {
        // If no line items to update, just commit the invoice changes
        await queryRunner.commitTransaction();
      }

      const updatedInvoice = await this.findById(id);
      if (!updatedInvoice) {
        throw new Error(`Failed to retrieve updated invoice with ID ${id}`);
      }

      return updatedInvoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingInvoice = await this.findById(id);
      if (!existingInvoice) {
        throw new Error(`Invoice with ID ${id} not found`);
      }

      await queryRunner.manager.delete(InvoiceLineItem, {_invoiceId: id});
      await queryRunner.manager.delete(Invoice, {_id: id});

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await queryRunner.release();
    }
  }

  async addLineItem(invoiceId: string, lineItemData: Partial<InvoiceLineItem>): Promise<InvoiceLineItem> {
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

  async updateLineItem(lineItemId: string, updateData: Partial<InvoiceLineItem>): Promise<InvoiceLineItem> {
    try {
      const existingLineItem = await this.lineItemRepo.findOne({
        where: {_id: lineItemId},
        relations: ['invoice']
      });

      if (!existingLineItem) {
        throw new Error(`Line item with ID ${lineItemId} not found`);
      }

      await this.lineItemRepo.update(lineItemId, updateData);
      await this.updateInvoiceTotal(existingLineItem.invoice._id);

      const updatedLineItem = await this.lineItemRepo.findOne({
        where: {_id: lineItemId},
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

  async removeLineItem(lineItemId: string): Promise<void> {
    try {
      const existingLineItem = await this.lineItemRepo.findOne({
        where: {_id: lineItemId},
        relations: ['invoice']
      });

      if (!existingLineItem) {
        throw new Error(`Line item with ID ${lineItemId} not found`);
      }

      const invoiceId = existingLineItem.invoice._id;
      await this.lineItemRepo.delete(lineItemId);
      await this.updateInvoiceTotal(invoiceId);
    } catch (error) {
      throw new Error(`Failed to remove line item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateInvoiceTotal(invoiceId: string): Promise<void> {
    try {
      const lineItems = await this.lineItemRepo.find({
        where: {_invoiceId: invoiceId}
      });

      const total = lineItems.reduce((sum, item) => sum + (item.unitTotal || 0), 0);

      await this.invoiceRepo.update({_id: invoiceId}, {total});
    } catch (error) {
      throw new Error(`Failed to update invoice total: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInvoicesByStatus(draft: boolean = false, canceled: boolean = false, billed: boolean = false): Promise<Invoice[]> {
    try {
      return await this.invoiceRepo.find({
        where: {draft, canceled, billed},
        relations: ['customer', 'lineItems'],
        order: {invoiceDate: 'DESC'}
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoices by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markAsBilled(id: string): Promise<Invoice> {
    try {
      return await this.update(id, {billed: true, draft: false});
    } catch (error) {
      throw new Error(`Failed to mark invoice as billed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markAsCanceled(id: string): Promise<Invoice> {
    try {
      return await this.update(id, {canceled: true});
    } catch (error) {
      throw new Error(`Failed to mark invoice as canceled: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
