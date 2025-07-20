import { Repository } from 'typeorm';
import { Customer } from '../entity/Customer';

export class CustomerService {
  constructor(private customerRepo: Repository<Customer>) {}

  async findAll(): Promise<Customer[]> {
    try {
      return await this.customerRepo.find({
        relations: ['projects', 'invoices'],
        order: { customerNumber: 'ASC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<Customer | null> {
    try {
      return await this.customerRepo.findOne({
        where: { _id: id },
        relations: ['projects', 'invoices']
      });
    } catch (error) {
      throw new Error(`Failed to fetch customer with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByCustomerNumber(customerNumber: string): Promise<Customer | null> {
    try {
      return await this.customerRepo.findOne({
        where: { customerNumber },
        relations: ['projects', 'invoices']
      });
    } catch (error) {
      throw new Error(`Failed to fetch customer with number ${customerNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async create(customerData: Partial<Customer>): Promise<Customer> {
    try {
      if (!customerData.customerNumber) {
        throw new Error('Customer number is required');
      }
      if (!customerData.company && !customerData.firstName) {
        throw new Error('Either company name or first name is required');
      }

      const existingCustomer = await this.findByCustomerNumber(customerData.customerNumber);
      if (existingCustomer) {
        throw new Error(`Customer with number ${customerData.customerNumber} already exists`);
      }

      const customer = this.customerRepo.create(customerData);
      return await this.customerRepo.save(customer);
    } catch (error) {
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(id: string, updateData: Partial<Customer>): Promise<Customer> {
    try {
      const existingCustomer = await this.findById(id);
      if (!existingCustomer) {
        throw new Error(`Customer with ID ${id} not found`);
      }

      if (updateData.customerNumber && updateData.customerNumber !== existingCustomer.customerNumber) {
        const customerWithSameNumber = await this.findByCustomerNumber(updateData.customerNumber);
        if (customerWithSameNumber) {
          throw new Error(`Customer with number ${updateData.customerNumber} already exists`);
        }
      }

      // Filter out relation fields that shouldn't be updated directly
      const { projects, invoices, ...dataToUpdate } = updateData;

      await this.customerRepo.update({ _id: id }, dataToUpdate);
      const updatedCustomer = await this.findById(id);
      
      if (!updatedCustomer) {
        throw new Error(`Failed to retrieve updated customer with ID ${id}`);
      }

      return updatedCustomer;
    } catch (error) {
      throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const existingCustomer = await this.findById(id);
      if (!existingCustomer) {
        throw new Error(`Customer with ID ${id} not found`);
      }

      await this.customerRepo.delete({ _id: id });
    } catch (error) {
      throw new Error(`Failed to delete customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async search(searchTerm: string): Promise<Customer[]> {
    try {
      return await this.customerRepo
        .createQueryBuilder('customer')
        .where('customer.company LIKE :term', { term: `%${searchTerm}%` })
        .orWhere('customer.firstName LIKE :term', { term: `%${searchTerm}%` })
        .orWhere('customer.lastName LIKE :term', { term: `%${searchTerm}%` })
        .orWhere('customer.customerNumber LIKE :term', { term: `%${searchTerm}%` })
        .orWhere('customer.email LIKE :term', { term: `%${searchTerm}%` })
        .leftJoinAndSelect('customer.projects', 'projects')
        .leftJoinAndSelect('customer.invoices', 'invoices')
        .orderBy('customer.customerNumber', 'ASC')
        .getMany();
    } catch (error) {
      throw new Error(`Failed to search customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomerStats(id: number): Promise<{
    totalProjects: number;
    activeProjects: number;
    totalInvoices: number;
    totalRevenue: number;
  }> {
    try {
      const customer = await this.customerRepo
        .createQueryBuilder('customer')
        .where('customer.id = :id', { id })
        .leftJoinAndSelect('customer.projects', 'projects')
        .leftJoinAndSelect('customer.invoices', 'invoices')
        .getOne();

      if (!customer) {
        throw new Error(`Customer with ID ${id} not found`);
      }

      const totalProjects = customer.projects?.length || 0;
      const activeProjects = customer.projects?.filter(p => p.state === 'active')?.length || 0;
      const totalInvoices = customer.invoices?.length || 0;
      const totalRevenue = customer.invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

      return {
        totalProjects,
        activeProjects,
        totalInvoices,
        totalRevenue
      };
    } catch (error) {
      throw new Error(`Failed to get customer stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}