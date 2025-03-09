import { Customer, Project, Task, TimesheetFilter, WorkLog } from "./types";
import Store from "./store.js";
import { convertUnixTimestampToTimeInput } from "./util/time-string-to-unix";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "node:path";
import { app } from "electron";
import { formatUnixTimestampToGermanDate } from "./util/timestamp-date-util";

interface ReportDataRow {
  project: Project;
  task: Task;
  workLog: WorkLog;
}

export function createTimeSheetReportCsvString(
  filter: TimesheetFilter
): string {
  const customer = fetchCustomerByFilter(filter);
  const startDate = formatUnixTimestampToGermanDate(filter.startDate).replace(
    ".",
    "-"
  );
  const endDate = formatUnixTimestampToGermanDate(filter.endDate).replace(
    ".",
    "-"
  );
  const projects = fetchProjectsByFilter(filter);
  const data = collectReportData(filter.startDate, filter.endDate, projects);
  const buffer = createReportBuffer(data);
  const exportDirectory = getExportDirectory();
  const reportFilePath = path.join(
    exportDirectory,
    `${customer.customerNumber}_${startDate}_${endDate}.xlsx`
  );

  if (!fs.existsSync(exportDirectory)) {
    fs.mkdirSync(exportDirectory, { recursive: true });
  }

  fs.writeFileSync(reportFilePath, buffer);

  return reportFilePath;
}

export function createTimeSheetReportData(
  filter: TimesheetFilter
): ReportDataRow[] {
  const projects = fetchProjectsByFilter(filter);
  return collectReportData(filter.startDate, filter.endDate, projects);
}

function fetchCustomerByFilter(filter: TimesheetFilter): Customer {
  const store = new Store({
    configName: "customer-data",
    defaults: { customerData: [] },
  });

  const customer: Customer | null = store.getSingle(
    "customerData",
    filter._customerId
  );

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}

function fetchProjectsByFilter(filter: TimesheetFilter): Project[] {
  const store = new Store({
    configName: "project-data",
    defaults: { projectData: [] },
  });
  const projects = store.get("projectData");

  if (filter._projectId) {
    const project: Project = projects.find((p) => p._id === filter._projectId);
    return [project];
  }

  return projects.filter((p) => p._customerId === filter._customerId);
}

function collectReportData(
  startDate: number,
  endDate: number,
  projects: Project[]
): ReportDataRow[] {
  if (projects.length === 0) {
    return [];
  }

  const rows: ReportDataRow[] = [];
  for (const project of projects) {
    for (const task of project.tasks) {
      for (const workLog of task.workLogs) {
        if (!workLog.billable) {
          continue;
        }
        if (workLog.creationDateTime < startDate) {
          continue;
        }
        if (workLog.creationDateTime > endDate) {
          continue;
        }
        rows.push({ project, task, workLog });
      }
    }
  }

  return rows;
}

function createReportBuffer(data: ReportDataRow[]): Buffer {
  // Convert data to worksheet format
  const rows = data.map((row) => ({
    Project: row.project.projectNumber,
    Task: row.task.title,
    Message: row.workLog.message,
    "Tracked Time": convertUnixTimestampToTimeInput(row.workLog.trackedTime),
  }));
  // Calculate total
  const total = data.reduce((sum, row) => sum + row.workLog.trackedTime, 0);
  rows.push({
    Project: "Total:",
    Task: "",
    Message: "",
    "Tracked Time": convertUnixTimestampToTimeInput(total),
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Time Sheet Report");

  // Generate buffer
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

function getExportDirectory(): string {
  return path.join(app.getPath("userData"), "ease-pm-data", "time-sheets");
}
