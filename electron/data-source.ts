import "reflect-metadata"
import { DataSource } from "typeorm"
import {Customer} from "./entity/Customer";
import {Invoice} from "./entity/Invoice";
import {InvoiceLineItem} from "./entity/InvoiceLineItem";
import {Project} from "./entity/Project";
import {WorkLog} from "./entity/WorkLog";
import {Task} from "./entity/Task";
import path from "node:path";
import {app} from "electron";

const databasePath = path.join(app.getPath("userData"), "easepm.db");

export const AppDataSource = new DataSource({
    type: "better-sqlite3",
    database: databasePath,
    synchronize: true,
    logging: false,
    entities: [Customer, Invoice, InvoiceLineItem, Project, Task, WorkLog],
    migrations: [],
    subscribers: [],
})
