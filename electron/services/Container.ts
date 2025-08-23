import {AppDataSource} from '../data-source';
import {CustomerService} from './CustomerService';
import {InvoiceService} from './InvoiceService';
import {ProjectService} from './ProjectService';
import {TaskService} from './TaskService';
import {WorkLogService} from './WorkLogService';
import {Customer} from '../entity/Customer';
import {Invoice} from '../entity/Invoice';
import {InvoiceLineItem} from '../entity/InvoiceLineItem';
import {Project} from '../entity/Project';
import {Task} from '../entity/Task';
import {WorkLog} from '../entity/WorkLog';

export interface ServiceContainer {
  customerService: CustomerService;
  invoiceService: InvoiceService;
  projectService: ProjectService;
  taskService: TaskService;
  workLogService: WorkLogService;
}

export function createServiceContainer(): ServiceContainer {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database connection not initialized. Please initialize the database first.');
  }

  const customerRepo = AppDataSource.getRepository(Customer);
  const invoiceRepo = AppDataSource.getRepository(Invoice);
  const lineItemRepo = AppDataSource.getRepository(InvoiceLineItem);
  const projectRepo = AppDataSource.getRepository(Project);
  const taskRepo = AppDataSource.getRepository(Task);
  const workLogRepo = AppDataSource.getRepository(WorkLog);

  return {
    customerService: new CustomerService(customerRepo),
    invoiceService: new InvoiceService(invoiceRepo, lineItemRepo, customerRepo),
    projectService: new ProjectService(projectRepo, taskRepo, customerRepo),
    taskService: new TaskService(taskRepo, workLogRepo, projectRepo),
    workLogService: new WorkLogService(workLogRepo, taskRepo)
  };
}
