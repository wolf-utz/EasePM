import "reflect-metadata"
import {DataSource} from "typeorm"
import {Customer} from "./entity/Customer";
import {Invoice} from "./entity/Invoice";
import {InvoiceLineItem} from "./entity/InvoiceLineItem";
import {Project} from "./entity/Project";
import {WorkLog} from "./entity/WorkLog";
import {Task} from "./entity/Task";
import path from "node:path";
import {app} from "electron";
import config from "./config/env";

const getDatabasePath = () => {
    const filename = "easepm.db";
    const isTest = config.isTest || process.env.NODE_ENV === 'test';
    const isDev = config.isDevelopment || process.env.NODE_ENV === 'development';
    if (isTest) {
        return path.join(app.getPath("userData"), `test.${filename}`);
    }
    if (isDev) {
        return path.join(app.getPath("userData"), `dev.${filename}`);
    }
    return path.join(app.getPath("userData"), filename);
};

const databasePath = getDatabasePath();

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
    dropSchema: config.isTest,
    cache: config.isProduction,
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
            console.info(`[Database] Attempting to initialize database connection (attempt ${attempt + 1}/${retries})`);
            console.info(`[Database] Environment: ${config.NODE_ENV} (isDev: ${config.isDevelopment})`);
            console.info(`[Database] Database path: ${databasePath}`);

            await AppDataSource.initialize();

            console.info('[Database] Database connection established successfully');
            console.info(`[Database] Connected to SQLite database at: ${databasePath}`);
            console.info(`[Database] Entities loaded: ${AppDataSource.entityMetadatas.map(meta => meta.name).join(', ')}`);

            // Test the connection by running a simple query
            await AppDataSource.query('SELECT 1');
            console.info('[Database] Database connection test passed');

            return;
        } catch (error) {
            attempt++;
            console.error(`[Database] Failed to initialize database (attempt ${attempt}/${retries}):`, error);

            if (attempt >= retries) {
                console.error('[Database] All retry attempts exhausted. Database initialization failed.');
                throw new Error(`Database initialization failed after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            console.info(`[Database] Retrying in ${delay}ms...`);
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
            console.info('[Database] Database connection closed successfully');
        }
    } catch (error) {
        console.error('[Database] Error closing database connection:', error);
        throw error;
    }
}

/**
 * Reset the test database by dropping all data
 * Only works in test environment
 */
export const resetTestDatabase = async (): Promise<void> => {
    if (!config.isTest) {
        throw new Error('resetTestDatabase can only be called in test environment');
    }

    try {
        if (!AppDataSource.isInitialized) {
            return;
        }
        for (const entity of AppDataSource.entityMetadatas) {
            const repository = AppDataSource.getRepository(entity.name);
            await repository.clear();
        }
        console.info('[Test Database] All test data cleared successfully');
    } catch (error) {
        console.error('[Test Database] Error resetting test database:', error);
        throw error;
    }
}
