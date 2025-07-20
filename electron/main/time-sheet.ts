import { TimesheetFilter } from "./types";
import { convertUnixTimestampToTimeInput } from "./util/time-string-to-unix";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "node:path";
import { app } from "electron";
import { formatUnixTimestampToGermanDate } from "./util/timestamp-date-util";
import { createServiceContainer, ServiceContainer } from "../services/Container";
import { Customer } from "../entity/Customer";
import { Project } from "../entity/Project";
import { Task } from "../entity/Task";
import { WorkLog } from "../entity/WorkLog";

interface ReportDataRow {
  project: Project;
  task: Task;
  workLog: WorkLog;
}

export async function createTimeSheetReportCsvString(
  filter: TimesheetFilter
): Promise<string> {
  const serviceContainer = createServiceContainer();
  const customer = await fetchCustomerByFilter(filter, serviceContainer);
  const startDate = formatUnixTimestampToGermanDate(filter.startDate).replace(
    ".",
    "-"
  );
  const endDate = formatUnixTimestampToGermanDate(filter.endDate).replace(
    ".",
    "-"
  );
  const projects = await fetchProjectsByFilter(filter, serviceContainer);
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

export async function createTimeSheetReportData(
  filter: TimesheetFilter
): Promise<ReportDataRow[]> {
  const serviceContainer = createServiceContainer();
  const projects = await fetchProjectsByFilter(filter, serviceContainer);
  return collectReportData(filter.startDate, filter.endDate, projects);
}

async function fetchCustomerByFilter(filter: TimesheetFilter, serviceContainer: ServiceContainer): Promise<Customer> {
  const customer = await serviceContainer.customerService.findById(filter._customerId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}

async function fetchProjectsByFilter(filter: TimesheetFilter, serviceContainer: ServiceContainer): Promise<Project[]> {
  if (filter._projectId) {
    const project = await serviceContainer.projectService.findById(filter._projectId);
    return project ? [project] : [];
  }

  return await serviceContainer.projectService.findByCustomerId(filter._customerId);
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
    if (!project.tasks || !Array.isArray(project.tasks)) {
      continue;
    }
    for (const task of project.tasks) {
      if (!task.workLogs || !Array.isArray(task.workLogs)) {
        continue;
      }
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
