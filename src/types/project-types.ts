export enum ProjectState {
  OPEN = "OPEN",
  IN_PROGESS = "IN PROGESS",
  DONE = "DONE",
}
export enum TaskState {
  OPEN = "OPEN",
  IN_PROGRESS = "IN PROGRESS",
  PAUSED = "PAUSED",
  QA = "QA",
  DONE = "DONE",
}

export interface WorkLog {
  creationDateTime: number;
  displayDateTime: number;
  message: string;
  trackedTime: number;
  billable: boolean;
}

export interface Task {
  taskNumber: string;
  title: string;
  description: string;
  state: string;
  creationDateTime: number;
  updatedDateTime: number;
  workLogs: WorkLog[];
}

export interface Project {
  _id: string;
  _customerId: string;
  title: string;
  projectNumber: string;
  description: string;
  state: string;
  creationDateTime: number;
  taskAutoIncrement: number;
  tasks: Task[];
}
