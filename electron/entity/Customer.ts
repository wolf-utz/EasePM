import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm"
import {InvoiceLineItem} from "./InvoiceLineItem";
import {Invoice} from "./Invoice";
import {Project} from "./Project";

@Entity()
export class Customer {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: "varchar"})
    customerNumber: string

    @Column({type: "varchar"})
    company: string

    @Column({type: "varchar"})
    firstName: string

    @Column({type: "varchar"})
    lastName: string

    @Column({type: "text"})
    address: string

    @Column({type: "varchar"})
    city: string

    @Column({type: "varchar"})
    zip: string

    @Column({type: "varchar"})
    email: string

    @Column({type: "varchar"})
    country: string

    @OneToMany(() => Invoice, (invoice) => invoice.customer)
    invoices: Invoice[]

    @OneToMany(() => Project, (project) => project.customer)
    projects: Project[]
}