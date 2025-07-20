import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn} from "typeorm"
import {Task} from "./Task";

@Entity("work_log")
export class WorkLog {
    @PrimaryGeneratedColumn("uuid")
    _id: string

    @Column({type: "int"})
    creationDateTime: number

    @Column({type: "int"})
    displayDateTime: number

    @Column({type: "text"})
    message: string

    @Column({type: "int"})
    trackedTime: number

    @Column({type: "boolean"})
    billable: boolean

    @Column({type: "varchar"})
    _taskId: string

    @ManyToOne(() => Task, (task) => task.workLogs)
    @JoinColumn({ name: "_taskId" })
    task: Task
}