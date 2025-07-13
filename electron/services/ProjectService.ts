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

  async findById(id: number): Promise<Project | null> {
    try {
      return await this.projectRepo.findOne({
        where: { id },
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

  async findByCustomerId(customerId: number): Promise<Project[]> {
    try {
      return await this.projectRepo.find({
        where: { customer: { id: customerId } },
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
      if (!projectData.customer?.id) {
        throw new Error('Customer is required');
      }

      const existingProject = await this.findByProjectNumber(projectData.projectNumber);
      if (existingProject) {
        throw new Error(`Project with number ${projectData.projectNumber} already exists`);
      }

      const customer = await this.customerRepo.findOne({
        where: { id: projectData.customer.id }
      });
      if (!customer) {
        throw new Error(`Customer with ID ${projectData.customer.id} not found`);
      }

      const project = this.projectRepo.create({
        ...projectData,
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

  async update(id: number, updateData: Partial<Project>): Promise<Project> {
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

      await this.projectRepo.update(id, updateData);
      const updatedProject = await this.findById(id);
      
      if (!updatedProject) {
        throw new Error(`Failed to retrieve updated project with ID ${id}`);
      }

      return updatedProject;
    } catch (error) {
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: number): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingProject = await this.findById(id);
      if (!existingProject) {
        throw new Error(`Project with ID ${id} not found`);
      }

      const tasks = await this.taskRepo.find({
        where: { project: { id } },
        relations: ['workLogs']
      });

      for (const task of tasks) {
        if (task.workLogs && task.workLogs.length > 0) {
          await queryRunner.manager.delete('WorkLog', { task: { id: task.id } });
        }
      }

      await queryRunner.manager.delete(Task, { project: { id } });
      await queryRunner.manager.delete(Project, id);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await queryRunner.release();
    }
  }

  async addTask(projectId: number, taskData: Partial<Task>): Promise<Task> {
    try {
      const project = await this.findById(projectId);
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      const taskNumber = `${project.projectNumber}-${project.taskAutoIncrement}`;
      
      const task = this.taskRepo.create({
        ...taskData,
        taskNumber,
        project,
        creationDateTime: taskData.creationDateTime || Math.floor(Date.now() / 1000),
        updatedDateTime: Math.floor(Date.now() / 1000),
        state: taskData.state || 'todo'
      });

      const savedTask = await this.taskRepo.save(task);

      await this.projectRepo.update(projectId, {
        taskAutoIncrement: project.taskAutoIncrement + 1
      });

      return savedTask;
    } catch (error) {
      throw new Error(`Failed to add task to project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjectTasks(projectId: number): Promise<Task[]> {
    try {
      return await this.taskRepo.find({
        where: { project: { id: projectId } },
        relations: ['workLogs'],
        order: { creationDateTime: 'ASC' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch tasks for project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjectStats(id: number): Promise<{
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

  async updateProjectState(id: number, state: string): Promise<Project> {
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

  async getProjectProgress(id: number): Promise<{
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
}