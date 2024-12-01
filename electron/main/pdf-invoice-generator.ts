import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export interface PdfInvoice {
  font: {
    size: number;
    default: string;
    bold: string;
    sizeSmall: number;
  };
  seller: {
    name: string;
    address: string;
    zip: string;
    city: string;
    country: string;
    taxNumber: string;
    email: string;
    banking: {
      bank: string;
      iban: string;
      bic: string;
    };
  };
  buyer: {
    company?: string;
    name: string;
    address: string;
    zip: string;
    city: string;
    customerNumber: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  title: string;
  introText: string;
  lineItems: Array<{
    qty: number;
    description: string;
    unit: string;
    unitPrice: number;
    unitTotal: number;
    title: string;
  }>;
  total: number;
  paymentNote: string;
  taxHint: string;
  outroText: string;
  signature: string;
  logo: string;
}
function createInvoicePdf(
  invoice: PdfInvoice,
  exportPath: string,
  isDraft: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      doc.fontSize(invoice.font.size);
      doc.font(invoice.font.default);

      generateHeader(doc, invoice);
      generateSellerInformation(doc, invoice);
      generateBuyerInformation(doc, invoice);
      generateIntro(doc, invoice);
      generateFooter(doc, invoice);
      generateTableHeader(doc, invoice);
      generateLineItems(doc, invoice);
      generateOutro(doc, invoice);

      if (isDraft) {
        addDraftWatermark(doc);
      }

      const stream = fs.createWriteStream(
        `${exportPath}/${invoice.invoiceNumber}.pdf`
      );
      doc.pipe(stream);
      doc.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

function addDraftWatermark(doc: PDFKit.PDFDocument): void {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const fontSize = 100;
  const text = "DRAFT";

  doc.fontSize(fontSize);
  doc.fillColor("red");
  doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
  doc.opacity(0.3);
  doc.text(text, 0, 350, {
    align: "center",
    width: pageWidth,
  });
  doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
  doc.opacity(1);
  doc.fillColor("black");
}

function generateHeader(doc: PDFKit.PDFDocument, invoice: PdfInvoice): void {
  function calculateXForRightAlign(
    imageWidth: number,
    pageWidth: number,
    margin: number
  ): number {
    return pageWidth - imageWidth - margin;
  }

  const pageWidth = doc.page.width;
  const imageWidth = 200;
  const marginRight = 50;

  const posX = calculateXForRightAlign(imageWidth, pageWidth, marginRight);

  doc.image(invoice.logo, posX, 50, { width: 200 });
}

function generateSellerInformation(
  doc: PDFKit.PDFDocument,
  invoice: PdfInvoice
): void {
  doc.font(invoice.font.bold);
  doc.text(invoice.seller.name, 50, 100, { continued: true });
  doc.font(invoice.font.default);
  doc
    .text(
      ` - ${invoice.seller.address} - ${invoice.seller.zip} ${invoice.seller.city}`,
      50,
      100
    )
    .moveDown()
    .moveDown();
}

function generateBuyerInformation(
  doc: PDFKit.PDFDocument,
  invoice: PdfInvoice
): void {
  const initY = doc.y;

  doc.fontSize(invoice.font.sizeSmall);

  const spacing = 0;
  if (invoice.buyer.company) {
    doc.font(invoice.font.bold);
    doc.text(invoice.buyer.company);
    doc.y = doc.y + spacing;
  }
  doc.font(invoice.font.default);
  doc.text(invoice.buyer.name);
  doc.y = doc.y + spacing;
  doc.text(invoice.buyer.address);
  doc.y = doc.y + spacing;
  doc.text(`${invoice.buyer.zip} ${invoice.buyer.city}`);

  const tableContent = [
    { header: "Rechnungs-Nr.", value: invoice.invoiceNumber },
    { header: "Kunden-Nr.", value: invoice.buyer.customerNumber },
    { header: "Rechnungsdatum", value: invoice.invoiceDate },
    { header: "Lieferdatum", value: invoice.deliveryDate },
  ];

  let startY = initY;
  const rowHeight = 15;
  const columnWidth = 85;

  const totalTableWidth = 2 * columnWidth;
  const pageWidth = doc.page.width;
  const rightMargin = 50;
  const tableStartX = pageWidth - totalTableWidth - rightMargin;

  const valueColumnOffset = 0;
  const valueColumnStartX = tableStartX + columnWidth + valueColumnOffset;

  tableContent.forEach((row, index) => {
    doc.font(invoice.font.bold);
    doc.text(row.header, tableStartX, startY + rowHeight * index, {
      width: columnWidth,
      align: "left",
    });
    doc.font(invoice.font.default);
    doc.text(row.value, valueColumnStartX, startY + rowHeight * index, {
      width: columnWidth,
      align: "right",
    });
  });
  doc.moveDown();
  doc.fontSize(invoice.font.size);
}

function generateIntro(doc: PDFKit.PDFDocument, invoice: PdfInvoice): void {
  doc.x = 50;
  doc.fontSize(invoice.font.size * 2);
  doc.text(invoice.title);
  doc.fontSize(invoice.font.size);
  doc.moveDown();
  doc.text(invoice.introText);
  doc.moveDown();
  doc.moveDown();
}

function generateLineItems(doc: PDFKit.PDFDocument, invoice: PdfInvoice): void {
  doc.y = doc.y + 10;

  for (let i = 0; i < invoice.lineItems.length; i++) {
    const { qty, description, unit, unitPrice, unitTotal, title } =
      invoice.lineItems[i];

    doc.moveDown();

    generateTableRow(
      doc,
      invoice,
      i + 1,
      qty,
      title,
      description,
      unit,
      formatCurrency(unitPrice),
      formatCurrency(unitTotal)
    );
  }

  doc.font(invoice.font.bold);
  doc.moveDown();
  generateTableRow(
    doc,
    invoice,
    "",
    "",
    "",
    "",
    "",
    "Gesamt",
    formatCurrency(invoice.total)
  );
}

function generateTableHeader(
  doc: PDFKit.PDFDocument,
  invoice: PdfInvoice
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const columnSpacing = 10;

  const posWidth = 25;
  const einheitWidth = 50;
  const anzahlWidth = 30;
  const preisWidth = 65;
  const summeWidth = 65;

  const bezeichnungWidth =
    pageWidth -
    margin * 2 -
    posWidth -
    einheitWidth -
    anzahlWidth -
    preisWidth -
    summeWidth -
    columnSpacing * 5;

  const posStartX = margin;
  const bezeichnungStartX = posStartX + posWidth + columnSpacing;
  const einheitStartX = bezeichnungStartX + bezeichnungWidth + columnSpacing;
  const anzahlStartX = einheitStartX + einheitWidth + columnSpacing;
  const preisStartX = anzahlStartX + anzahlWidth + columnSpacing;
  const summeStartX = preisStartX + preisWidth + columnSpacing;

  const y = doc.y;
  doc.font(invoice.font.bold);

  doc.text("Pos.", posStartX, y, { width: posWidth });
  doc.text("Bezeichnung", bezeichnungStartX, y, { width: bezeichnungWidth });
  doc.text("Einheit", einheitStartX, y, {
    width: einheitWidth,
    align: "right",
  });
  doc.text("Anz.", anzahlStartX, y, { width: anzahlWidth, align: "right" });
  doc.text("Preis", preisStartX, y, { width: preisWidth, align: "right" });
  doc.text("Summe", summeStartX, y, { width: summeWidth, align: "right" });

  doc.font(invoice.font.default);

  generateHr(doc, y + 20);
}

function generateTableRow(
  doc: PDFKit.PDFDocument,
  invoice: PdfInvoice,
  pos: number | string,
  qty: number | string,
  title: string,
  description: string,
  unit: string,
  price: string,
  total: string
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const columnSpacing = 10;
  const footerHeight = 100;

  const posWidth = 25;
  const einheitWidth = 50;
  const anzahlWidth = 30;
  const preisWidth = 65;
  const summeWidth = 65;

  const bezeichnungWidth =
    pageWidth -
    margin * 2 -
    posWidth -
    einheitWidth -
    anzahlWidth -
    preisWidth -
    summeWidth -
    columnSpacing * 5;

  const posStartX = margin;
  const bezeichnungStartX = posStartX + posWidth + columnSpacing;
  const einheitStartX = bezeichnungStartX + bezeichnungWidth + columnSpacing;
  const anzahlStartX = einheitStartX + einheitWidth + columnSpacing;
  const preisStartX = anzahlStartX + anzahlWidth + columnSpacing;
  const summeStartX = preisStartX + preisWidth + columnSpacing;

  let y = doc.y;

  const descriptionHeight = doc.heightOfString(description, {
    width: bezeichnungWidth,
  });
  if (y + descriptionHeight + 25 > doc.page.height - footerHeight) {
    doc.addPage();
    generateFooter(doc, invoice);
    doc.y = 50;
    generateTableHeader(doc, invoice);
    doc.y = doc.y + 20;
    y = doc.y;
  }

  doc.text(pos, posStartX, y, { width: posWidth, align: "center" });
  doc.font(invoice.font.bold);
  doc.text(title, bezeichnungStartX, y, { width: bezeichnungWidth });
  doc.font(invoice.font.default);
  doc.text(unit, einheitStartX, y, {
    width: einheitWidth,
    align: "right",
  });
  doc.text(qty, anzahlStartX, y, { width: anzahlWidth, align: "right" });
  doc.font(invoice.font.bold);

  doc.text(price, preisStartX, y, { width: preisWidth, align: "right" });
  doc.text(total, summeStartX, y, { width: summeWidth, align: "right" });
  doc.font(invoice.font.default);

  const descriptionWidth = pageWidth - margin - bezeichnungStartX;
  doc.text(description, bezeichnungStartX, y + 25, { width: descriptionWidth });
}

function generateHr(doc: PDFKit.PDFDocument, y: number): void {
  doc.strokeColor("#30C48D").lineWidth(1).moveTo(50, y).lineTo(565, y).stroke();
}

function generateOutro(doc: PDFKit.PDFDocument, invoice: PdfInvoice): void {
  const footerHeight = 125;
  const pageHeight = doc.page.height;
  const startY = doc.y;
  const margin = 50;

  let totalHeightNeeded = 0;
  totalHeightNeeded += doc.heightOfString(invoice.paymentNote, {
    width: doc.page.width - margin * 2,
  });
  totalHeightNeeded += doc.heightOfString(invoice.taxHint, {
    width: doc.page.width - margin * 2,
  });
  totalHeightNeeded += doc.heightOfString(invoice.outroText, {
    width: doc.page.width - margin * 2,
  });
  totalHeightNeeded += doc.heightOfString(invoice.signature, {
    width: doc.page.width - margin * 2,
  });
  totalHeightNeeded += doc.currentLineHeight() * 4;

  if (startY + totalHeightNeeded > pageHeight - footerHeight) {
    doc.addPage();
    generateFooter(doc, invoice);
    doc.x = margin;
  } else {
    doc.x = margin;
  }

  doc.moveDown();
  doc.text(invoice.paymentNote);
  doc.moveDown();
  doc.text(invoice.taxHint);
  doc.moveDown();
  doc.text(invoice.outroText);
  doc.moveDown();
  doc.moveDown();
  doc.text(invoice.signature);
}

function generateFooter(doc: PDFKit.PDFDocument, invoice: PdfInvoice): void {
  doc.fontSize(invoice.font.sizeSmall);
  const yBefore = doc.y;
  doc.y = 665;
  generateHr(doc, doc.y);

  doc.y = 680;
  generateSellerFooterInformation(doc, invoice);

  doc.y = 680;
  generateSellerAdditionalFooterInformation(doc, invoice);

  doc.y = 680;
  generateSellerBankingFooterInformation(doc, invoice);

  doc.y = yBefore;
  doc.fontSize(invoice.font.size);
}

function generateSellerFooterInformation(
  doc: PDFKit.PDFDocument,
  invoice: PdfInvoice
): void {
  const yStart = doc.y;
  doc.font(invoice.font.bold);
  doc.text(invoice.seller.name, 50, yStart);
  doc.font(invoice.font.default);

  doc.text(invoice.seller.address, 50, yStart + 20);
  doc.text(invoice.seller.zip + " " + invoice.seller.city, 50, yStart + 35);
  doc.text(invoice.seller.country, 50, yStart + 50);
}

function generateSellerAdditionalFooterInformation(
  doc: PDFKit.PDFDocument,
  invoice: PdfInvoice
): void {
  const yStart = doc.y;
  const x = doc.page.width / 2;
  doc.text("Steuernummer: " + invoice.seller.taxNumber, 50, yStart, {
    align: "center",
  });
  doc.text("E-Mail: " + invoice.seller.email, 50, yStart + 15, {
    align: "center",
  });
}

function generateSellerBankingFooterInformation(
  doc: PDFKit.PDFDocument,
  invoice: PdfInvoice
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const yStart = doc.y;
  const texts = [
    "Bankverbindung",
    invoice.seller.banking.bank,
    invoice.seller.banking.iban,
    invoice.seller.banking.bic,
  ];

  const maxWidth = Math.max(...texts.map((text) => doc.widthOfString(text)));
  const blockStartX = pageWidth - margin - maxWidth;

  doc.font(invoice.font.bold);
  doc.text("Bankverbindung", blockStartX, yStart, { align: "left" });

  doc.font(invoice.font.default);
  doc.text(invoice.seller.banking.bank, blockStartX, yStart + 20, {
    align: "left",
  });
  doc.text(invoice.seller.banking.iban, blockStartX, yStart + 35, {
    align: "left",
  });
  doc.text(invoice.seller.banking.bic, blockStartX, yStart + 50, {
    align: "left",
  });
}

function formatCurrency(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(euros);
}

export { createInvoicePdf };
