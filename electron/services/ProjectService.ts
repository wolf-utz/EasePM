import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Project } from '../entity/Project';
import { Task } from '../entity/Task';
import { Customer } from '../entity/Customer';

export class ProjectService {
  constructor(
    private projectRepo: Repository<Project>,
    private taskRepo: Repository<Task>,
    private customerRepo: Repository<Customer>
  ) {}

  async findAll(): Promise<Project[]> {
    try {
      return await this.projectRepo.find({
        relations: ['customer', 'tasks', 'tasks.workLogs'],
        order: { creationDateTime: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<Project | null> {
    try {
      return await this.projectRepo.findOne({
        where: { _id: id },
        relations: ['customer', 'tasks', 'tasks.workLogs']
      });
    } catch (error) {
      throw new Error(`Failed to fetch project with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByProjectNumber(projectNumber: string): Promise<Project | null> {
    try {
      return await this.projectRepo.findOne({
        where: { projectNumber },
        relations: ['customer', 'tasks', 'tasks.workLogs']
      });
    } catch (error) {
      throw new Error(`Failed to fetch project with number ${projectNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByCustomerId(customerId: string): Promise<Project[]> {
    try {
      return await this.projectRepo.find({
        where: { _customerId: customerId },
        relations: ['customer', 'tasks', 'tasks.workLogs'],
        order: { creationDateTime: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch projects for customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByState(state: string): Promise<Project[]> {
    try {
      return await this.projectRepo.find({
        where: { state },
        relations: ['customer', 'tasks', 'tasks.workLogs'],
        order: { creationDateTime: 'DESC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch projects with state ${state}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async create(projectData: Partial<Project>): Promise<Project> {
    try {
      if (!projectData.projectNumber) {
        throw new Error('Project number is required');
      }
      if (!projectData.title) {
        throw new Error('Project title is required');
      }
      if (!projectData._customerId) {
        throw new Error('Customer ID is required');
      }

      const existingProject = await this.findByProjectNumber(projectData.projectNumber);
      if (existingProject) {
        throw new Error(`Project with number ${projectData.projectNumber} already exists`);
      }

      const customer = await this.customerRepo.findOne({
        where: { _id: projectData._customerId }
      });
      if (!customer) {
        throw new Error(`Customer with ID ${projectData._customerId} not found`);
      }

      const project = this.projectRepo.create({
        ...projectData,
        _customerId: projectData._customerId,
        customer,
        creationDateTime: projectData.creationDateTime || Math.floor(Date.now() / 1000),
        taskAutoIncrement: projectData.taskAutoIncrement || 1,
        state: projectData.state || 'active'
      });

      return await this.projectRepo.save(project);
    } catch (error) {
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(id: string, updateData: Partial<Project>): Promise<Project> {
    try {
      const existingProject = await this.findById(id);
      if (!existingProject) {
        throw new Error(`Project with ID ${id} not found`);
      }

      if (updateData.projectNumber && updateData.projectNumber !== existingProject.projectNumber) {
        const projectWithSameNumber = await this.findByProjectNumber(updateData.projectNumber);
        if (projectWithSameNumber) {
          throw new Error(`Project with number ${updateData.projectNumber} already exists`);
        }
      }

      // Filter out relation fields that shouldn't be updated directly
      const { customer, tasks, ...dataToUpdate } = updateData;

      await this.projectRepo.update({ _id: id }, dataToUpdate);
      const updatedProject = await this.findById(id);
      
      if (!updatedProject) {
        throw new Error(`Failed to retrieve updated project with ID ${id}`);
      }

      return updatedProject;
    } catch (error) {
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingProject = await this.findById(id);
      if (!existingProject) {
        throw new Error(`Project with ID ${id} not found`);
      }

      const tasks = await this.taskRepo.find({
        where: { _projectId: id },
        relations: ['workLogs']
      });

      for (const task of tasks) {
        if (task.workLogs && task.workLogs.length > 0) {
          await queryRunner.manager.delete('WorkLog', { _taskId: task._id });
        }
      }

      await queryRunner.manager.delete('Task', { _projectId: id });
      await queryRunner.manager.delete('Project', { _id: id });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await queryRunner.release();
    }
  }

  async addTask(projectId: string, taskData: Partial<Task>): Promise<Task> {
    try {
      const project = await this.findById(projectId);
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      // Auto-generate unique task number
      let counter = project.taskAutoIncrement;
      let taskNumber: string;
      do {
        taskNumber = `${project.projectNumber}-${counter}`;
        const existingTask = await this.taskRepo.findOne({
          where: { taskNumber }
        });
        if (!existingTask) {
          break;
        }
        counter++;
      } while (true);
      
      const task = this.taskRepo.create({
        ...taskData,
        taskNumber,
        _projectId: projectId,
        project,
        creationDateTime: taskData.creationDateTime || Math.floor(Date.now() / 1000),
        updatedDateTime: Math.floor(Date.now() / 1000),
        state: taskData.state || 'todo'
      });

      const savedTask = await this.taskRepo.save(task);

      // Update the project's taskAutoIncrement to the next available number
      await this.projectRepo.update({ _id: projectId }, {
        taskAutoIncrement: counter + 1
      });

      return savedTask;
    } catch (error) {
      throw new Error(`Failed to add task to project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      return await this.taskRepo.find({
        where: { _projectId: projectId },
        relations: ['workLogs'],
        order: { creationDateTime: 'ASC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch tasks for project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjectStats(id: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    totalTimeLogged: number;
    billableTimeLogged: number;
  }> {
    try {
      const project = await this.findById(id);
      if (!project) {
        throw new Error(`Project with ID ${id} not found`);
      }

      const tasks = project.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.state === 'done').length;
      const inProgressTasks = tasks.filter(t => t.state === 'in-progress').length;
      const todoTasks = tasks.filter(t => t.state === 'todo').length;

      let totalTimeLogged = 0;
      let billableTimeLogged = 0;

      tasks.forEach(task => {
        if (task.workLogs) {
          task.workLogs.forEach(workLog => {
            totalTimeLogged += workLog.trackedTime || 0;
            if (workLog.billable) {
              billableTimeLogged += workLog.trackedTime || 0;
            }
          });
        }
      });

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        totalTimeLogged,
        billableTimeLogged
      };
    } catch (error) {
      throw new Error(`Failed to get project stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProjectState(id: string, state: string): Promise<Project> {
    try {
      return await this.update(id, { state });
    } catch (error) {
      throw new Error(`Failed to update project state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async search(searchTerm: string): Promise<Project[]> {
    try {
      return await this.projectRepo
        .createQueryBuilder('project')
        .where('project.title LIKE :term', { term: `%${searchTerm}%` })
        .orWhere('project.description LIKE :term', { term: `%${searchTerm}%` })
        .orWhere('project.projectNumber LIKE :term', { term: `%${searchTerm}%` })
        .leftJoinAndSelect('project.customer', 'customer')
        .leftJoinAndSelect('project.tasks', 'tasks')
        .leftJoinAndSelect('tasks.workLogs', 'workLogs')
        .orderBy('project.creationDateTime', 'DESC')
        .getMany();
    } catch (error) {
      throw new Error(`Failed to search projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjectProgress(id: string): Promise<{
    completionPercentage: number;
    tasksProgress: {
      todo: number;
      inProgress: number;
      done: number;
    };
  }> {
    try {
      const stats = await this.getProjectStats(id);
      
      const completionPercentage = stats.totalTasks > 0 
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0;

      return {
        completionPercentage,
        tasksProgress: {
          todo: stats.todoTasks,
          inProgress: stats.inProgressTasks,
          done: stats.completedTasks
        }
      };
    } catch (error) {
      throw new Error(`Failed to get project progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async syncTaskAutoIncrement(projectId: string): Promise<void> {
    try {
      const project = await this.findById(projectId);
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      // Find the highest task number for this project
      const tasks = await this.taskRepo.find({
        where: { _projectId: projectId }
      });

      let maxTaskNumber = 0;
      const projectPrefix = `${project.projectNumber}-`;
      
      tasks.forEach(task => {
        if (task.taskNumber && task.taskNumber.startsWith(projectPrefix)) {
          const numberPart = task.taskNumber.substring(projectPrefix.length);
          const taskNum = parseInt(numberPart, 10);
          if (!isNaN(taskNum) && taskNum > maxTaskNumber) {
            maxTaskNumber = taskNum;
          }
        }
      });

      // Set taskAutoIncrement to one more than the highest existing task number
      await this.projectRepo.update({ _id: projectId }, {
        taskAutoIncrement: maxTaskNumber + 1
      });

      console.log(`Synced taskAutoIncrement for project ${project.projectNumber} to ${maxTaskNumber + 1}`);
    } catch (error) {
      throw new Error(`Failed to sync task auto increment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async syncAllTaskAutoIncrements(): Promise<void> {
    try {
      const projects = await this.findAll();
      console.log(`Syncing task auto increments for ${projects.length} projects...`);
      
      for (const project of projects) {
        await this.syncTaskAutoIncrement(project._id);
      }
      
      console.log('Finished syncing all task auto increments');
    } catch (error) {
      throw new Error(`Failed to sync all task auto increments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}