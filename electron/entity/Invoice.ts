import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn} from "typeorm"
import {InvoiceLineItem} from "./InvoiceLineItem";
import {Customer} from "./Customer";

@Entity("invoice")
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  _id: string

  @Column({type: "varchar"})
  invoiceNumber: string

  @Column({type: "int"})
  total: number

  @Column({type: "int"})
  invoiceDate: number

  @Column({type: "int"})
  deliveryDate: number

  @Column({type: "boolean"})
  draft: boolean

  @Column({type: "boolean"})
  canceled: boolean

  @Column({type: "boolean"})
  billed: boolean

  @OneToMany(() => InvoiceLineItem, (lineItem) => lineItem.invoice)
  lineItems: InvoiceLineItem[]

  @Column({type: "varchar"})
  _customerId: string

  @ManyToOne(() => Customer, (customer) => customer.invoices)
  @JoinColumn({name: "_customerId"})
  customer: Customer
}
