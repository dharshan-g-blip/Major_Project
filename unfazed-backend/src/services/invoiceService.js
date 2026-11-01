const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class InvoiceService {
  constructor() {
    this.invoicesDir = path.join(__dirname, '../../uploads/invoices');
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    return `INV-${year}-${randomSeq}`;
  }

  /**
   * Generates a GST-compliant invoice PDF with precise, non-overlapping spacing
   */
  async generateGSTInvoice({ payment, therapist, client, itemDescription }) {
    const invoiceNumber = payment.invoice_number || this.generateInvoiceNumber();
    const fileName = `${invoiceNumber}.pdf`;
    const filePath = path.join(this.invoicesDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Color Palette
        const primaryColor = '#0D5C54'; // Deep healthcare teal
        const darkText = '#0F172A';     // Slate 900
        const bodyText = '#334155';     // Slate 700
        const mutedText = '#64748B';    // Slate 500
        const borderLight = '#E2E8F0';  // Slate 200

        // 1. Header Banner (Left: Title, Right: Provider Details)
        doc
          .fontSize(22)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('TAX INVOICE', 40, 42);

        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(mutedText)
          .text('HEALTHCARE SERVICES | SAC 999312', 40, 68);

        // Provider Details (Right-aligned with dynamic vertical layout)
        let providerY = 42;
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(darkText)
          .text(therapist.name || 'Practitioner', 300, providerY, { width: 255, align: 'right' });
        providerY += 16;

        const qual = therapist.qualifications || 'Licensed Mental Health Practitioner';
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor(mutedText)
          .text(qual, 300, providerY, { width: 255, align: 'right' });
        providerY += doc.heightOfString(qual, { width: 255 }) + 3;

        const addr = therapist.clinicAddress || 'Karnataka, India';
        doc.text(addr, 300, providerY, { width: 255, align: 'right' });
        providerY += 13;

        doc.text(`Email: ${therapist.email || 'care@serenova.care'}`, 300, providerY, { width: 255, align: 'right' });
        providerY += 13;

        doc.text(`Phone: ${therapist.phone || '+91 98765 43210'}`, 300, providerY, { width: 255, align: 'right' });
        providerY += 16;

        // Top Horizontal Divider
        const divider1Y = Math.max(providerY, 130);
        doc.moveTo(40, divider1Y).lineTo(555, divider1Y).strokeColor(borderLight).lineWidth(1).stroke();

        // 2. Invoice Meta & Client Billing Section
        const metaTop = divider1Y + 16;

        // Left Column: Invoice Details
        doc
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('INVOICE DETAILS', 40, metaTop);

        let leftMetaY = metaTop + 16;
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor(bodyText)
          .text(`Invoice No: `, 40, leftMetaY, { continued: true })
          .font('Helvetica-Bold')
          .text(invoiceNumber);
        leftMetaY += 15;

        doc
          .font('Helvetica')
          .text(`Date of Issue: `, 40, leftMetaY, { continued: true })
          .font('Helvetica-Bold')
          .text(new Date(payment.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
        leftMetaY += 15;

        const txId = String(payment.gateway_transaction_id || payment.order_id || 'N/A');
        doc
          .font('Helvetica')
          .text(`Transaction ID: `, 40, leftMetaY, { continued: true })
          .font('Helvetica-Bold')
          .text(txId, { width: 250 });
        leftMetaY += doc.heightOfString(`Transaction ID: ${txId}`, { width: 250 }) + 3;

        doc
          .font('Helvetica')
          .text(`Payment Mode: `, 40, leftMetaY, { continued: true })
          .font('Helvetica-Bold')
          .text(payment.payment_method || 'UPI / Online');
        leftMetaY += 15;

        // Right Column: Client Details
        doc
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('BILLED TO (CLIENT)', 310, metaTop);

        let rightMetaY = metaTop + 16;
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor(bodyText)
          .text(`Client Name: `, 310, rightMetaY, { continued: true })
          .font('Helvetica-Bold')
          .text(client.name || 'Client');
        rightMetaY += 15;

        doc
          .font('Helvetica')
          .text(`Email: `, 310, rightMetaY, { continued: true })
          .font('Helvetica-Bold')
          .text(client.email || 'N/A');
        rightMetaY += 15;

        doc
          .font('Helvetica')
          .text(`Phone: `, 310, rightMetaY, { continued: true })
          .font('Helvetica-Bold')
          .text(client.phone || 'N/A');
        rightMetaY += 15;

        doc
          .font('Helvetica')
          .text(`Place of Supply: `, 310, rightMetaY, { continued: true })
          .font('Helvetica-Bold')
          .text('India (Intra/Interstate Outpatient)');
        rightMetaY += 15;

        // 3. Table Header & Items
        const metaBottomY = Math.max(leftMetaY, rightMetaY) + 16;
        doc.moveTo(40, metaBottomY).lineTo(555, metaBottomY).strokeColor(borderLight).stroke();

        const tableTop = metaBottomY + 12;
        doc
          .roundedRect(40, tableTop, 515, 26, 4)
          .fillColor('#F1F5F9')
          .fill();

        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(darkText)
          .text('ITEM & DESCRIPTION', 50, tableTop + 8, { width: 200 })
          .text('SAC CODE', 260, tableTop + 8, { width: 70, align: 'center' })
          .text('RATE (INR)', 340, tableTop + 8, { width: 95, align: 'right' })
          .text('AMOUNT (INR)', 445, tableTop + 8, { width: 95, align: 'right' });

        // Calculation: 18% GST Breakdown
        const totalGross = Number(payment.amount) || 2000;
        const baseAmount = Math.round((totalGross / 1.18) * 100) / 100;
        const totalGst = Math.round((totalGross - baseAmount) * 100) / 100;
        const cgst = Math.round((totalGst / 2) * 100) / 100;
        const sgst = Math.round((totalGst - cgst) * 100) / 100;

        const rowY = tableTop + 36;
        const desc = itemDescription || payment.description || 'Clinical Psychotherapy Consultation';
        const descHeight = doc.heightOfString(desc, { width: 200 });

        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(darkText)
          .text(desc, 50, rowY, { width: 200 })
          .text('999312', 260, rowY, { width: 70, align: 'center' })
          .text(baseAmount.toFixed(2), 340, rowY, { width: 95, align: 'right' })
          .text(baseAmount.toFixed(2), 445, rowY, { width: 95, align: 'right' });

        const divider2Y = rowY + Math.max(descHeight, 18) + 14;
        doc.moveTo(40, divider2Y).lineTo(555, divider2Y).strokeColor(borderLight).stroke();

        // 4. Financial Summary
        const summaryTop = divider2Y + 16;
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(mutedText)
          .text('Subtotal (Taxable Value):', 310, summaryTop, { width: 130, align: 'right' })
          .font('Helvetica-Bold')
          .fillColor(darkText)
          .text(`INR ${baseAmount.toFixed(2)}`, 445, summaryTop, { width: 95, align: 'right' });

        doc
          .font('Helvetica')
          .fillColor(mutedText)
          .text('CGST @ 9%:', 310, summaryTop + 18, { width: 130, align: 'right' })
          .font('Helvetica')
          .fillColor(darkText)
          .text(`INR ${cgst.toFixed(2)}`, 445, summaryTop + 18, { width: 95, align: 'right' });

        doc
          .font('Helvetica')
          .fillColor(mutedText)
          .text('SGST @ 9%:', 310, summaryTop + 36, { width: 130, align: 'right' })
          .font('Helvetica')
          .fillColor(darkText)
          .text(`INR ${sgst.toFixed(2)}`, 445, summaryTop + 36, { width: 95, align: 'right' });

        const subDividerY = summaryTop + 56;
        doc.moveTo(310, subDividerY).lineTo(540, subDividerY).strokeColor(borderLight).stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor(primaryColor)
          .text('Total Paid:', 310, subDividerY + 10, { width: 130, align: 'right' })
          .text(`INR ${totalGross.toFixed(2)}`, 445, subDividerY + 10, { width: 95, align: 'right' });

        // 5. Footer Compliance & Safe Notice
        doc
          .roundedRect(40, 715, 515, 42, 6)
          .fillColor('#F8FAFC')
          .strokeColor(borderLight)
          .fillAndStroke();

        doc
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('ELECTRONIC TAX INVOICE — SERENOVA HEALTHCARE SUITE', 40, 723, { width: 515, align: 'center' });

        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor(mutedText)
          .text('Authorized outpatient clinical record generated in compliance with the Mental Healthcare Act 2017.', 40, 735, { width: 515, align: 'center' })
          .text('All therapy consultations are subject to verified clinician-client confidentiality guidelines.', 40, 745, { width: 515, align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve({
            invoiceNumber,
            fileName,
            filePath,
            url: `/api/payments/invoice/${fileName}`,
          });
        });

        stream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new InvoiceService();
