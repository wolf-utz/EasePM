import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn} from "typeorm"
import {Invoice} from "./Invoice";

@Entity("invoice_line_item")
export class InvoiceLineItem {
  @PrimaryGeneratedColumn("uuid")
  _id: string

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

  @Column({type: "varchar"})
  _invoiceId: string

  @ManyToOne(() => Invoice, (invoice) => invoice.lineItems)
  @JoinColumn({name: "_invoiceId"})
  invoice: Invoice
}
