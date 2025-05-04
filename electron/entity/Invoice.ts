import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne} from "typeorm"
import {InvoiceLineItem} from "./InvoiceLineItem";
import {Customer} from "./Customer";

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: "varchar"})
    invoiceNumber: string

    @Column({type: "int"})
    total: number

    @Column({type: "int"})
    invoiceDate: number

    @Column({type: "int"})
    deliveryDate: number

    @Column({type: "int"})
    draft: boolean

    @Column({type: "int"})
    canceled: boolean

    @Column({type: "int"})
    billed: boolean

    @OneToMany(() => InvoiceLineItem, (lineItem) => lineItem.invoice)
    lineItems: InvoiceLineItem[]

    @ManyToOne(() => Customer, (customer) => customer.invoices)
    customer: Customer
}