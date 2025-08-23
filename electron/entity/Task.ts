import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn} from "typeorm"
import {WorkLog} from "./WorkLog";
import {Project} from "./Project";

@Entity("task")
export class Task {
  @PrimaryGeneratedColumn("uuid")
  _id: string

  @Column({type: "varchar"})
  taskNumber: string

  @Column({type: "varchar"})
  title: string

  @Column({type: "text"})
  description: string

  @Column({type: "varchar"})
  state: string

  @Column({type: "int"})
  creationDateTime: number

  @Column({type: "int"})
  updatedDateTime: number

  @Column({type: "varchar"})
  _projectId: string

  @OneToMany(() => WorkLog, (workLog) => workLog.task)
  workLogs: WorkLog[]

  @ManyToOne(() => Project, (project) => project.tasks)
  @JoinColumn({name: "_projectId"})
  project: Project
}
