import { AppDataSource } from "../data-source"
import {InvoiceLineItem} from "../entity/InvoiceLineItem";
import {Invoice} from "../entity/Invoice";
import {Customer} from "../entity/Customer";
import {WorkLog} from "../entity/WorkLog";
import {Task} from "../entity/Task";
import {Project} from "../entity/Project";


export default function () {
   // testInvoiceAndCRM();
    testProjectsAndTasks();
}

function testInvoiceAndCRM() {
    AppDataSource.initialize().then(async () => {
        const invoiceLineItem = new InvoiceLineItem()
        invoiceLineItem.title = "Test"
        invoiceLineItem.description = "Lorem ispum"
        invoiceLineItem.quantity = 12
        invoiceLineItem.unit = "kg"
        invoiceLineItem.unitPrice = 12
        invoiceLineItem.unitTotal = 144
        await AppDataSource.manager.save(invoiceLineItem)

        const invoice = new Invoice();
        invoice.draft = true
        invoice.invoiceDate = 1234567890
        invoice.deliveryDate = 1234567890
        invoice.invoiceNumber = "1234567890"
        invoice.total = 1234567890
        invoice.canceled = false
        invoice.billed = false
        invoice.lineItems = [invoiceLineItem];
        await AppDataSource.manager.save(invoice)

        const customer = new Customer();
        customer.company = "Test Company"
        customer.firstName = "John"
        customer.lastName = "Doe"
        customer.customerNumber = "123"
        customer.address = "123 Main St"
        customer.city = "New York"
        customer.zip = "10001"
        customer.email = "j.d@example.com"
        customer.country = "USA"
        customer.invoices = [invoice];

        await AppDataSource.manager.save(customer)

        const customers = await AppDataSource.getRepository(Customer).find({
            relations: {
                invoices: {
                    lineItems: true
                }
            }
        });
        console.log("Loaded customers: ", customers)

    }).catch(error => console.log(error))
}

function testProjectsAndTasks() {
    AppDataSource.initialize().then(async () => {

        // const workLog = new WorkLog()
        // workLog.creationDateTime = 1234567890
        // workLog.displayDateTime = 1234567890
        // workLog.message = "Test"
        // workLog.trackedTime = 1234567890
        // workLog.billable = true
        //
        // await AppDataSource.manager.save(workLog)
        //
        // const task = new Task()
        // task.taskNumber = "123"
        // task.title = "Test"
        // task.description = "Lorem ispum"
        // task.state = "open"
        // task.creationDateTime = 1234567890
        // task.updatedDateTime = 1234567890
        // task.workLogs = [workLog]
        //
        // await AppDataSource.manager.save(task)
        //
        // const project = new Project()
        // project.projectNumber = "123"
        // project.title = "Test"
        // project.description = "Lorem ispum"
        // project.state = "open"
        // project.creationDateTime = 1234567890
        // project.taskAutoIncrement = 1
        // project.tasks = [task]
        //
        // await AppDataSource.manager.save(project)
        //
        // const projects = await AppDataSource.getRepository(Project).find({
        //     relations: {
        //         tasks: {
        //             workLogs: true
        //         }
        //     }
        // });
        // console.log("Loaded projects: ", projects)
        // console.log("Loaded projects: ", projects[0].tasks);
        // console.log("Loaded projects: ", projects[0].tasks[0].workLogs);
        //


        const project = await AppDataSource.getRepository(Project).findOneBy({id: 2});
        const customer = await AppDataSource.getRepository(Customer).findOneBy({id: 4});
        customer.projects = [project]

        await AppDataSource.getRepository(Customer).save(customer)

        const customer2 = await AppDataSource.getRepository(Customer).findOne({
            where: {
                id: 4
            },
            relations: {
                projects: true
            }
        });


        console.log("Loaded customer: ", customer2)


        }).catch(error => console.log(error))
}