import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { WorkLog } from '../entity/WorkLog';
import { Task } from '../entity/Task';

export class WorkLogService {
  constructor(
    private workLogRepo: Repository<WorkLog>,
    private taskRepo: Repository<Task>
  ) {}

  async findAll(): Promise<WorkLog[]> {
    try {
      return await this.workLogRepo.find({
        relations: ['task', 'task.project', 'task.project.customer'],
        order: { displayDateTime: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch work logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<WorkLog | null> {
    try {
      return await this.workLogRepo.findOne({
        where: { _id: id },
        relations: ['task', 'task.project', 'task.project.customer']
      });
    } catch (error) {
      throw new Error(`Failed to fetch work log with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByTaskId(taskId: string): Promise<WorkLog[]> {
    try {
      return await this.workLogRepo.find({
        where: { _taskId: taskId },
        relations: ['task', 'task.project', 'task.project.customer'],
        order: { displayDateTime: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch work logs for task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByProjectId(projectId: string): Promise<WorkLog[]> {
    try {
      return await this.workLogRepo.find({
        where: { task: { _projectId: projectId } },
        relations: ['task', 'task.project', 'task.project.customer'],
        order: { displayDateTime: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch work logs for project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByDateRange(startDate: number, endDate: number): Promise<WorkLog[]> {
    try {
      return await this.workLogRepo
        .createQueryBuilder('workLog')
        .where('workLog.displayDateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
        .leftJoinAndSelect('workLog.task', 'task')
        .leftJoinAndSelect('task.project', 'project')
        .leftJoinAndSelect('project.customer', 'customer')
        .orderBy('workLog.displayDateTime', 'DESC')
        .getMany();
    } catch (error) {
      throw new Error(`Failed to fetch work logs by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findBillable(billable: boolean = true): Promise<WorkLog[]> {
    try {
      return await this.workLogRepo.find({
        where: { billable },
        relations: ['task', 'task.project', 'task.project.customer'],
        order: { displayDateTime: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch ${billable ? 'billable' : 'non-billable'} work logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async create(workLogData: Partial<WorkLog>): Promise<WorkLog> {
    try {
      if (!workLogData._taskId) {
        throw new Error('Task ID is required');
      }
      if (!workLogData.message) {
        throw new Error('Work log message is required');
      }
      if (!workLogData.trackedTime || workLogData.trackedTime <= 0) {
        throw new Error('Tracked time must be greater than 0');
      }

      const task = await this.taskRepo.findOne({
        where: { _id: workLogData._taskId }
      });
      if (!task) {
        throw new Error(`Task with ID ${workLogData._taskId} not found`);
      }

      const workLog = this.workLogRepo.create({
        ...workLogData,
        _taskId: workLogData._taskId,
        task,
        creationDateTime: workLogData.creationDateTime || Math.floor(Date.now() / 1000),
        displayDateTime: workLogData.displayDateTime || workLogData.creationDateTime || Math.floor(Date.now() / 1000),
        billable: workLogData.billable !== undefined ? workLogData.billable : true
      });

      const savedWorkLog = await this.workLogRepo.save(workLog);

      await this.taskRepo.update({ _id: task._id }, {
        updatedDateTime: Math.floor(Date.now() / 1000)
      });

      return savedWorkLog;
    } catch (error) {
      throw new Error(`Failed to create work log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(id: string, updateData: Partial<WorkLog>): Promise<WorkLog> {
    try {
      const existingWorkLog = await this.findById(id);
      if (!existingWorkLog) {
        throw new Error(`Work log with ID ${id} not found`);
      }

      if (updateData.trackedTime !== undefined && updateData.trackedTime <= 0) {
        throw new Error('Tracked time must be greater than 0');
      }

      // Filter out relation fields that shouldn't be updated directly
      const { task, ...dataToUpdate } = updateData;

      await this.workLogRepo.update({ _id: id }, dataToUpdate);

      if (existingWorkLog.task) {
        await this.taskRepo.update({ _id: existingWorkLog.task._id }, {
          updatedDateTime: Math.floor(Date.now() / 1000)
        });
      }

      const updatedWorkLog = await this.findById(id);
      
      if (!updatedWorkLog) {
        throw new Error(`Failed to retrieve updated work log with ID ${id}`);
      }

      return updatedWorkLog;
    } catch (error) {
      throw new Error(`Failed to update work log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const existingWorkLog = await this.findById(id);
      if (!existingWorkLog) {
        throw new Error(`Work log with ID ${id} not found`);
      }

      await this.workLogRepo.delete({ _id: id });

      if (existingWorkLog.task) {
        await this.taskRepo.update({ _id: existingWorkLog.task._id }, {
          updatedDateTime: Math.floor(Date.now() / 1000)
        });
      }
    } catch (error) {
      throw new Error(`Failed to delete work log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTotalTimeByTask(taskId: string): Promise<{
    totalTime: number;
    billableTime: number;
    nonBillableTime: number;
    workLogCount: number;
  }> {
    try {
      const workLogs = await this.findByTaskId(taskId);
      
      const totalTime = workLogs.reduce((sum, log) => sum + (log.trackedTime || 0), 0);
      const billableTime = workLogs
        .filter(log => log.billable)
        .reduce((sum, log) => sum + (log.trackedTime || 0), 0);
      const nonBillableTime = totalTime - billableTime;

      return {
        totalTime,
        billableTime,
        nonBillableTime,
        workLogCount: workLogs.length
      };
    } catch (error) {
      throw new Error(`Failed to get time summary for task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTotalTimeByProject(projectId: string): Promise<{
    totalTime: number;
    billableTime: number;
    nonBillableTime: number;
    workLogCount: number;
  }> {
    try {
      const workLogs = await this.findByProjectId(projectId);
      
      const totalTime = workLogs.reduce((sum, log) => sum + (log.trackedTime || 0), 0);
      const billableTime = workLogs
        .filter(log => log.billable)
        .reduce((sum, log) => sum + (log.trackedTime || 0), 0);
      const nonBillableTime = totalTime - billableTime;

      return {
        totalTime,
        billableTime,
        nonBillableTime,
        workLogCount: workLogs.length
      };
    } catch (error) {
      throw new Error(`Failed to get time summary for project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTotalTimeByDateRange(startDate: number, endDate: number): Promise<{
    totalTime: number;
    billableTime: number;
    nonBillableTime: number;
    workLogCount: number;
    dailyBreakdown: Array<{
      date: number;
      totalTime: number;
      billableTime: number;
    }>;
  }> {
    try {
      const workLogs = await this.findByDateRange(startDate, endDate);
      
      const totalTime = workLogs.reduce((sum, log) => sum + (log.trackedTime || 0), 0);
      const billableTime = workLogs
        .filter(log => log.billable)
        .reduce((sum, log) => sum + (log.trackedTime || 0), 0);
      const nonBillableTime = totalTime - billableTime;

      const dailyBreakdown = this.calculateDailyBreakdown(workLogs);

      return {
        totalTime,
        billableTime,
        nonBillableTime,
        workLogCount: workLogs.length,
        dailyBreakdown
      };
    } catch (error) {
      throw new Error(`Failed to get time summary for date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateDailyBreakdown(workLogs: WorkLog[]): Array<{
    date: number;
    totalTime: number;
    billableTime: number;
  }> {
    const dailyMap = new Map<string, { totalTime: number; billableTime: number }>();

    workLogs.forEach(log => {
      const date = new Date(log.displayDateTime * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { totalTime: 0, billableTime: 0 });
      }

      const dayData = dailyMap.get(dateKey)!;
      dayData.totalTime += log.trackedTime || 0;
      if (log.billable) {
        dayData.billableTime += log.trackedTime || 0;
      }
    });

    return Array.from(dailyMap.entries()).map(([dateKey, data]) => ({
      date: Math.floor(new Date(dateKey).getTime() / 1000),
      totalTime: data.totalTime,
      billableTime: data.billableTime
    })).sort((a, b) => a.date - b.date);
  }

  async parseTimeString(timeString: string): Promise<number> {
    try {
      let totalSeconds = 0;
      const timeRegex = /(\d+)([wdhm])/g;
      let match;

      while ((match = timeRegex.exec(timeString)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
          case 'w':
            totalSeconds += value * 7 * 24 * 60 * 60;
            break;
          case 'd':
            totalSeconds += value * 24 * 60 * 60;
            break;
          case 'h':
            totalSeconds += value * 60 * 60;
            break;
          case 'm':
            totalSeconds += value * 60;
            break;
        }
      }

      if (totalSeconds === 0) {
        throw new Error('Invalid time string format. Use format like "2h 30m" or "1d 4h"');
      }

      return totalSeconds;
    } catch (error) {
      throw new Error(`Failed to parse time string: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async formatTimeToString(seconds: number): Promise<string> {
    try {
      if (seconds <= 0) return '0m';

      const weeks = Math.floor(seconds / (7 * 24 * 60 * 60));
      seconds %= 7 * 24 * 60 * 60;

      const days = Math.floor(seconds / (24 * 60 * 60));
      seconds %= 24 * 60 * 60;

      const hours = Math.floor(seconds / (60 * 60));
      seconds %= 60 * 60;

      const minutes = Math.floor(seconds / 60);

      const parts = [];
      if (weeks > 0) parts.push(`${weeks}w`);
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);

      return parts.join(' ') || '0m';
    } catch (error) {
      throw new Error(`Failed to format time: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async toggleBillable(id: string): Promise<WorkLog> {
    try {
      const workLog = await this.findById(id);
      if (!workLog) {
        throw new Error(`Work log with ID ${id} not found`);
      }

      return await this.update(id, { billable: !workLog.billable });
    } catch (error) {
      throw new Error(`Failed to toggle billable status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentWorkLogs(limit: number = 10): Promise<WorkLog[]> {
    try {
      return await this.workLogRepo.find({
        relations: ['task', 'task.project', 'task.project.customer'],
        order: { displayDateTime: 'DESC' },
        take: limit
      });
    } catch (error) {
      throw new Error(`Failed to fetch recent work logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async search(searchTerm: string): Promise<WorkLog[]> {
    try {
      return await this.workLogRepo
        .createQueryBuilder('workLog')
        .where('workLog.message LIKE :term', { term: `%${searchTerm}%` })
        .leftJoinAndSelect('workLog.task', 'task')
        .leftJoinAndSelect('task.project', 'project')
        .leftJoinAndSelect('project.customer', 'customer')
        .orderBy('workLog.displayDateTime', 'DESC')
        .getMany();
    } catch (error) {
      throw new Error(`Failed to search work logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}