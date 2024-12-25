import { Task } from "../types/project-types";

export function calculateBillableTimeOfTask({ workLogs }: Task): number {
  let timeTotal: number = 0;

  if (workLogs.length === 0) {
    return 0;
  }

  for (let workLog of workLogs) {
    if (!workLog.billable || workLog.trackedTime <= 0) {
      continue;
    }

    timeTotal += workLog.trackedTime;
  }

  return timeTotal;
}
