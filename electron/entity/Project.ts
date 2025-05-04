import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne} from "typeorm"
import {Task} from "./Task";
import {Customer} from "./Customer";

@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: "varchar"})
    projectNumber: string

    @Column({type: "varchar"})
    title: string

    @Column({type: "text"})
    description: string

    @Column({type: "varchar"})
    state: string

    @Column({type: "int"})
    creationDateTime: number

    @Column({type: "int"})
    taskAutoIncrement: number

    @OneToMany(() => Task, (task) => task.project)
    tasks: Task[]

    @ManyToOne(() => Customer, (customer) => customer.invoices)
    customer: Customer
}