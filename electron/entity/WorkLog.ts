import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm"
import {Task} from "./Task";

@Entity()
export class WorkLog {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: "int"})
    creationDateTime: number

    @Column({type: "int"})
    displayDateTime: number

    @Column({type: "text"})
    message: string

    @Column({type: "int"})
    trackedTime: number

    @Column({type: "int"})
    billable: boolean

    @ManyToOne(() => Task, (task) => task.workLogs)
    task: Task
}