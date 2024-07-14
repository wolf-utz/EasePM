// const puppeteer = require("puppeteer");
import puppeteer from "puppeteer";

async function generatePDFfromHTML(htmlContent, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.pdf({ path: outputPath, format: "A4" });
    await browser.close();
}

// Usage

var html =
    "<style> html { -webkit-print-color-adjust: exact; } </style>" +
    '<div style="background-color:green;">' +
    "<h1>Hello world</h1>" +
    "<p>This is just a paragraph" +
    "<p style='color:red;'>I am red</p>" +
    "<p style='color:blue;'>I am blue</p>" +
    "<p style='font-size:50px;'>I am big</p>" +
    "<table style='border-collapse: collapse; width: 698px; height: 115px; background-color: #C5D9F1;' border='0' cellpadding='10'>" +
    "<tbody>" +
    "<tr>" +
    "<td style='padding: 5px;background-color:powderblue;' nowrap='nowrap'><strong>Bold with background-color:</strong></td>" +
    "</tr>" +
    "</tbody>" +
    "</table></div>";

 function createPdf(filePath) {
         generatePDFfromHTML(html, filePath)
             .then(() => console.log("PDF generated successfully"))
             .catch((err) => console.error("Error generating PDF:", err));

}

// module.exports = createPdf;
export default createPdf;