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
import config from "./config/env";

const databasePath = path.join(app.getPath("userData"), "easepm.db");

export const AppDataSource = new DataSource({
    type: "better-sqlite3",
    database: databasePath,
    synchronize: config.database.synchronize,
    logging: config.database.logging,
    entities: [Customer, Invoice, InvoiceLineItem, Project, Task, WorkLog],
    migrations: [],
    subscribers: [],
    extra: {
        options: "--enable-wal-mode"
    },
    dropSchema: false,
    cache: true,
    entitySkipConstructor: true
})

/**
 * Initialize the database connection with proper error handling and retry logic
 * @param retries - Number of retry attempts (default: 3)
 * @param delay - Delay between retries in milliseconds (default: 1000)
 */
export const initializeDatabase = async (retries = 3, delay = 1000): Promise<void> => {
    let attempt = 0;
    
    while (attempt < retries) {
        try {
            console.log(`[Database] Attempting to initialize database connection (attempt ${attempt + 1}/${retries})`);
            console.log(`[Database] Environment: ${config.NODE_ENV} (isDev: ${config.isDevelopment})`);
            console.log(`[Database] Database path: ${databasePath}`);
            
            await AppDataSource.initialize();
            
            console.log('[Database] Database connection established successfully');
            console.log(`[Database] Connected to SQLite database at: ${databasePath}`);
            console.log(`[Database] Entities loaded: ${AppDataSource.entityMetadatas.map(meta => meta.name).join(', ')}`);
            
            // Test the connection by running a simple query
            await AppDataSource.query('SELECT 1');
            console.log('[Database] Database connection test passed');
            
            return;
        } catch (error) {
            attempt++;
            console.error(`[Database] Failed to initialize database (attempt ${attempt}/${retries}):`, error);
            
            if (attempt >= retries) {
                console.error('[Database] All retry attempts exhausted. Database initialization failed.');
                throw new Error(`Database initialization failed after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            
            console.log(`[Database] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Gracefully close the database connection
 */
export const closeDatabase = async (): Promise<void> => {
    try {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('[Database] Database connection closed successfully');
        }
    } catch (error) {
        console.error('[Database] Error closing database connection:', error);
        throw error;
    }
}
