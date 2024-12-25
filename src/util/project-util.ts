import { Project } from "../types/project-types";

export function calculateBillableTime({ tasks }: Project): number {
  let timeTotal: number = 0;

  if (tasks.length === 0) {
    return 0;
  }

  for (let task of tasks) {
    if (task.workLogs.length === 0) {
      continue;
    }

    for (let workLog of task.workLogs) {
      if (!workLog.billable || workLog.trackedTime <= 0) {
        continue;
      }

      timeTotal += workLog.trackedTime;
    }
  }

  return timeTotal;
}
