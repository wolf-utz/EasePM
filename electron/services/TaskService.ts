import {Repository} from 'typeorm';
import {AppDataSource} from '../data-source';
import {Task} from '../entity/Task';
import {WorkLog} from '../entity/WorkLog';
import {Project} from '../entity/Project';

export class TaskService {
  constructor(
    private taskRepo: Repository<Task>,
    private workLogRepo: Repository<WorkLog>,
    private projectRepo: Repository<Project>
  ) {
  }

  async findAll(): Promise<Task[]> {
    try {
      return await this.taskRepo.find({
        relations: ['project', 'project.customer', 'workLogs'],
        order: {updatedDateTime: 'DESC'}
      });
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<Task | null> {
    try {
      return await this.taskRepo.findOne({
        where: {_id: id},
        relations: ['project', 'project.customer', 'workLogs']
      });
    } catch (error) {
      throw new Error(`Failed to fetch task with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByTaskNumber(taskNumber: string): Promise<Task | null> {
    try {
      return await this.taskRepo.findOne({
        where: {taskNumber},
        relations: ['project', 'project.customer', 'workLogs']
      });
    } catch (error) {
      throw new Error(`Failed to fetch task with number ${taskNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    try {
      return await this.taskRepo.find({
        where: {_projectId: projectId},
        relations: ['project', 'project.customer', 'workLogs'],
        order: {creationDateTime: 'ASC'}
      });
    } catch (error) {
      throw new Error(`Failed to fetch tasks for project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByState(state: string): Promise<Task[]> {
    try {
      return await this.taskRepo.find({
        where: {state},
        relations: ['project', 'project.customer', 'workLogs'],
        order: {updatedDateTime: 'DESC'}
      });
    } catch (error) {
      throw new Error(`Failed to fetch tasks with state ${state}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async create(taskData: Partial<Task>): Promise<Task> {
    try {
      if (!taskData.title) {
        throw new Error('Task title is required');
      }
      if (!taskData._projectId) {
        throw new Error('Project ID is required');
      }

      const project = await this.projectRepo.findOne({
        where: {_id: taskData._projectId}
      });
      if (!project) {
        throw new Error(`Project with ID ${taskData._projectId} not found`);
      }

      let taskNumber = taskData.taskNumber;

      if (!taskNumber) {
        // Auto-generate task number, ensuring it's unique
        let counter = project.taskAutoIncrement;
        do {
          taskNumber = `${project.projectNumber}-${counter}`;
          const existingTask = await this.findByTaskNumber(taskNumber);
          if (!existingTask) {
            break;
          }
          counter++;
        } while (true);

        // Update the project's taskAutoIncrement to the next available number
        await this.projectRepo.update({_id: project._id}, {
          taskAutoIncrement: counter + 1
        });
      } else {
        // If task number is provided, check if it already exists
        const existingTask = await this.findByTaskNumber(taskNumber);
        if (existingTask) {
          throw new Error(`Task with number ${taskNumber} already exists`);
        }
      }

      const task = this.taskRepo.create({
        ...taskData,
        taskNumber,
        _projectId: taskData._projectId,
        project,
        creationDateTime: taskData.creationDateTime || Math.floor(Date.now() / 1000),
        updatedDateTime: Math.floor(Date.now() / 1000),
        state: taskData.state || 'todo'
      });

      const savedTask = await this.taskRepo.save(task);

      return savedTask;
    } catch (error) {
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(id: string, updateData: Partial<Task>): Promise<Task> {
    try {
      const existingTask = await this.findById(id);
      if (!existingTask) {
        throw new Error(`Task with ID ${id} not found`);
      }

      if (updateData.taskNumber && updateData.taskNumber !== existingTask.taskNumber) {
        const taskWithSameNumber = await this.findByTaskNumber(updateData.taskNumber);
        if (taskWithSameNumber) {
          throw new Error(`Task with number ${updateData.taskNumber} already exists`);
        }
      }

      // Filter out relation fields that shouldn't be updated directly
      const {project, workLogs, ...dataToUpdate} = updateData;

      const updatedData = {
        ...dataToUpdate,
        updatedDateTime: Math.floor(Date.now() / 1000)
      };

      await this.taskRepo.update({_id: id}, updatedData);
      const updatedTask = await this.findById(id);

      if (!updatedTask) {
        throw new Error(`Failed to retrieve updated task with ID ${id}`);
      }

      return updatedTask;
    } catch (error) {
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingTask = await this.findById(id);
      if (!existingTask) {
        throw new Error(`Task with ID ${id} not found`);
      }

      await queryRunner.manager.delete(WorkLog, {_taskId: id});
      await queryRunner.manager.delete(Task, {_id: id});

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await queryRunner.release();
    }
  }

  async addWorkLog(taskId: string, workLogData: Partial<WorkLog>): Promise<WorkLog> {
    try {
      const task = await this.findById(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      const workLog = this.workLogRepo.create({
        ...workLogData,
        _taskId: taskId,
        task,
        creationDateTime: workLogData.creationDateTime || Math.floor(Date.now() / 1000),
        displayDateTime: workLogData.displayDateTime || workLogData.creationDateTime || Math.floor(Date.now() / 1000),
        billable: workLogData.billable !== undefined ? workLogData.billable : true
      });

      const savedWorkLog = await this.workLogRepo.save(workLog);

      await this.update(taskId, {updatedDateTime: Math.floor(Date.now() / 1000)});

      return savedWorkLog;
    } catch (error) {
      throw new Error(`Failed to add work log to task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTaskWorkLogs(taskId: string): Promise<WorkLog[]> {
    try {
      return await this.workLogRepo.find({
        where: {_taskId: taskId},
        relations: ['task'],
        order: {displayDateTime: 'DESC'}
      });
    } catch (error) {
      throw new Error(`Failed to fetch work logs for task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTaskState(id: string, state: string): Promise<Task> {
    try {
      return await this.update(id, {state});
    } catch (error) {
      throw new Error(`Failed to update task state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTaskStats(id: string): Promise<{
    totalWorkLogs: number;
    totalTimeLogged: number;
    billableTimeLogged: number;
    lastActivity: number | null;
  }> {
    try {
      const task = await this.findById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }

      const workLogs = task.workLogs || [];
      const totalWorkLogs = workLogs.length;
      const totalTimeLogged = workLogs.reduce((sum, log) => sum + (log.trackedTime || 0), 0);
      const billableTimeLogged = workLogs
        .filter(log => log.billable)
        .reduce((sum, log) => sum + (log.trackedTime || 0), 0);

      const lastActivity = workLogs.length > 0
        ? Math.max(...workLogs.map(log => log.displayDateTime))
        : null;

      return {
        totalWorkLogs,
        totalTimeLogged,
        billableTimeLogged,
        lastActivity
      };
    } catch (error) {
      throw new Error(`Failed to get task stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async search(searchTerm: string): Promise<Task[]> {
    try {
      return await this.taskRepo
        .createQueryBuilder('task')
        .where('task.title LIKE :term', {term: `%${searchTerm}%`})
        .orWhere('task.description LIKE :term', {term: `%${searchTerm}%`})
        .orWhere('task.taskNumber LIKE :term', {term: `%${searchTerm}%`})
        .leftJoinAndSelect('task.project', 'project')
        .leftJoinAndSelect('project.customer', 'customer')
        .leftJoinAndSelect('task.workLogs', 'workLogs')
        .orderBy('task.updatedDateTime', 'DESC')
        .getMany();
    } catch (error) {
      throw new Error(`Failed to search tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTasksByDateRange(startDate: number, endDate: number): Promise<Task[]> {
    try {
      return await this.taskRepo
        .createQueryBuilder('task')
        .where('task.creationDateTime BETWEEN :startDate AND :endDate', {startDate, endDate})
        .leftJoinAndSelect('task.project', 'project')
        .leftJoinAndSelect('project.customer', 'customer')
        .leftJoinAndSelect('task.workLogs', 'workLogs')
        .orderBy('task.creationDateTime', 'DESC')
        .getMany();
    } catch (error) {
      throw new Error(`Failed to fetch tasks by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentTasks(limit: number = 10): Promise<Task[]> {
    try {
      return await this.taskRepo.find({
        relations: ['project', 'project.customer', 'workLogs'],
        order: {updatedDateTime: 'DESC'},
        take: limit
      });
    } catch (error) {
      throw new Error(`Failed to fetch recent tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async moveTaskToProject(taskId: string, newProjectId: string): Promise<Task> {
    try {
      const task = await this.findById(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      const newProject = await this.projectRepo.findOne({
        where: {_id: newProjectId}
      });
      if (!newProject) {
        throw new Error(`Project with ID ${newProjectId} not found`);
      }

      const newTaskNumber = `${newProject.projectNumber}-${newProject.taskAutoIncrement}`;

      await this.taskRepo.update({_id: taskId}, {
        _projectId: newProjectId,
        taskNumber: newTaskNumber,
        updatedDateTime: Math.floor(Date.now() / 1000)
      });

      await this.projectRepo.update({_id: newProjectId}, {
        taskAutoIncrement: newProject.taskAutoIncrement + 1
      });

      const updatedTask = await this.findById(taskId);
      if (!updatedTask) {
        throw new Error(`Failed to retrieve updated task with ID ${taskId}`);
      }

      return updatedTask;
    } catch (error) {
      throw new Error(`Failed to move task to project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
