import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne} from "typeorm"
import {WorkLog} from "./WorkLog";
import {Project} from "./Project";

@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id: number

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

    @OneToMany(() => WorkLog, (workLog) => workLog.task)
    workLogs: WorkLog[]

    @ManyToOne(() => Project, (project) => project.tasks)
    project: Project
}