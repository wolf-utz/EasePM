import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn} from "typeorm"
import {Task} from "./Task";
import {Customer} from "./Customer";

@Entity("project")
export class Project {
  @PrimaryGeneratedColumn("uuid")
  _id: string

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

  @Column({type: "varchar"})
  _customerId: string

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[]

  @ManyToOne(() => Customer, (customer) => customer.projects)
  @JoinColumn({name: "_customerId"})
  customer: Customer
}
