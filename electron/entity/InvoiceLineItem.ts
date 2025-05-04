import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm"
import {Invoice} from "./Invoice";

@Entity()
export class InvoiceLineItem {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: "varchar"})
    title: string

    @Column({type: "text"})
    description: string

    @Column({type: "int"})
    quantity: number

    @Column({type: "varchar"})
    unit: string

    @Column({type: "int"})
    unitPrice: number

    @Column({type: "int"})
    unitTotal: number

    @ManyToOne(() => Invoice, (invoice) => invoice.lineItems)
    invoice: Invoice
}