import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bill, BillItem } from './billssStore';
import type { Partner } from './partnersStore';

export interface GenerateSaleBillParams {
  bill: Bill;
  items: BillItem[];
  partner?: Partner | null;
  billDate?: string;
  status?: string;
  balance?: number;
  notes?: string;
  totalAmount?: number;
}

async function loadLogoAsDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Generates a formatted Sale Invoice PDF with PlyAqua branding and logo
 * using jspdf and jspdf-autotable, and downloads it with target="_blank".
 */
export async function generateSaleBillPdf({
  bill,
  items,
  partner,
  billDate,
  status,
  balance,
  notes,
  totalAmount,
}: GenerateSaleBillParams): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  const effectiveBillDate = billDate || bill.bill_date || '—';
  const effectiveStatus = (status || bill.status || 'pending').toUpperCase();
  const effectiveBalance = Number(balance !== undefined ? balance : bill.balance) || 0;
  const effectiveNotes = notes !== undefined ? notes : bill.notes || '';
  const computedTotal =
    totalAmount !== undefined
      ? totalAmount
      : items.reduce((sum, item) => sum + (Number(item.row_total) || 0), 0);
  const paidAmount = Math.max(0, computedTotal - effectiveBalance);
  const totalUnits = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  const partnerName = partner?.name || bill.partner_name || 'Partner';
  const partnerCode = partner?.partner_id || '';
  const partnerMobile = partner?.mobile || bill.partner_mobile || '—';
  const partnerCategory =
    partner?.partner_category_name || bill.partner_category_name || '—';
  const partnerAddress = partner?.address || '';

  // Top Header Banner (PlyAqua Navy #0B253A + Teal accent #12B8B0)
  doc.setFillColor(11, 37, 58);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setFillColor(18, 184, 176);
  doc.rect(0, 34, pageWidth, 2, 'F');

  // Logo + Brand Name
  const logoDataUrl = await loadLogoAsDataUrl('/plyaqua_logo.png');
  let brandTextX = marginX;
  if (logoDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(marginX, 6, 22, 22, 2.5, 2.5, 'F');
    doc.addImage(logoDataUrl, 'PNG', marginX + 1.5, 7.5, 19, 19);
    brandTextX = marginX + 26;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PlyAqua', brandTextX, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 225, 235);
  doc.text('Pure Hydration & Distribution Network', brandTextX, 22);

  // Invoice Title on Top Right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SALE INVOICE', pageWidth - marginX, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(18, 184, 176);
  doc.text(`Invoice #: ${bill.bill_id}`, pageWidth - marginX, 22, { align: 'right' });

  // Metadata & Billed To Cards
  const infoStartY = 44;
  const colGap = 8;
  const boxWidth = (pageWidth - marginX * 2 - colGap) / 2;

  // Left Box: Billed To (Partner Details)
  doc.setFillColor(244, 247, 250);
  doc.setDrawColor(221, 227, 234);
  doc.roundedRect(marginX, infoStartY, boxWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 184, 176);
  doc.text('BILLED TO', marginX + 4, infoStartY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 37, 58);
  doc.text(partnerName, marginX + 4, infoStartY + 13, { maxWidth: boxWidth - 8 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(74, 91, 109);
  let leftLineY = infoStartY + 19;
  if (partnerCode) {
    doc.text(`Partner ID: ${partnerCode}`, marginX + 4, leftLineY);
    leftLineY += 5;
  }
  doc.text(`Mobile: ${partnerMobile}`, marginX + 4, leftLineY);
  leftLineY += 5;
  doc.text(`Category: ${partnerCategory}`, marginX + 4, leftLineY);
  if (partnerAddress) {
    leftLineY += 5;
    doc.text(partnerAddress, marginX + 4, leftLineY, { maxWidth: boxWidth - 8 });
  }

  // Right Box: Invoice Details
  const rightBoxX = marginX + boxWidth + colGap;
  doc.setFillColor(244, 247, 250);
  doc.setDrawColor(221, 227, 234);
  doc.roundedRect(rightBoxX, infoStartY, boxWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 184, 176);
  doc.text('INVOICE DETAILS', rightBoxX + 4, infoStartY + 6);

  const detailsRows: Array<[string, string]> = [
    ['Bill ID:', bill.bill_id],
    ['Bill Date:', effectiveBillDate],
    ['Status:', effectiveStatus],
    ['Total Items:', `${items.length} (${totalUnits} units)`],
  ];

  let detailY = infoStartY + 13;
  detailsRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(74, 91, 109);
    doc.text(label, rightBoxX + 4, detailY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 37, 58);
    doc.text(val, rightBoxX + boxWidth - 4, detailY, { align: 'right' });
    detailY += 6;
  });

  // Line Items Table using jspdf-autotable
  const tableBody = items.map((item, idx) => [
    String(idx + 1),
    item.product_name || 'Product',
    item.product_size || 'Standard',
    `$${(Number(item.sp) || 0).toFixed(2)}`,
    String(Number(item.qty) || 0),
    `$${(Number(item.row_total) || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: infoStartY + 46,
    margin: { left: marginX, right: marginX },
    head: [['#', 'Product Description', 'Size', 'Unit Price (SP)', 'Qty', 'Line Total']],
    body: tableBody.length > 0 ? tableBody : [['—', 'No line items', '—', '$0.00', '0', '$0.00']],
    theme: 'grid',
    headStyles: {
      fillColor: [11, 37, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [11, 37, 58],
      cellPadding: 3.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 253],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
    infoStartY + 70;

  // Summary Block (Right) & Notes Block (Left)
  let blockY = finalY + 8;
  if (blockY + 42 > pageHeight - 20) {
    doc.addPage();
    blockY = 20;
  }

  // Notes on Left
  if (effectiveNotes.trim()) {
    const notesWidth = pageWidth - marginX * 2 - 82;
    doc.setFillColor(248, 250, 253);
    doc.setDrawColor(221, 227, 234);
    doc.roundedRect(marginX, blockY, notesWidth, 32, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(11, 37, 58);
    doc.text('Notes / Remarks', marginX + 4, blockY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(74, 91, 109);
    doc.text(effectiveNotes.trim(), marginX + 4, blockY + 12, {
      maxWidth: notesWidth - 8,
    });
  }

  // Totals Box on Right
  const summaryWidth = 74;
  const summaryX = pageWidth - marginX - summaryWidth;
  doc.setFillColor(244, 247, 250);
  doc.setDrawColor(221, 227, 234);
  doc.roundedRect(summaryX, blockY, summaryWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(74, 91, 109);
  doc.text('Invoice Total:', summaryX + 4, blockY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 37, 58);
  doc.text(`$${computedTotal.toFixed(2)}`, summaryX + summaryWidth - 4, blockY + 8, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(74, 91, 109);
  doc.text('Amount Paid:', summaryX + 4, blockY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`$${paidAmount.toFixed(2)}`, summaryX + summaryWidth - 4, blockY + 15, {
    align: 'right',
  });

  // Divider inside summary box
  doc.setDrawColor(196, 207, 220);
  doc.line(summaryX + 4, blockY + 19, summaryX + summaryWidth - 4, blockY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 37, 58);
  doc.text('Balance Due:', summaryX + 4, blockY + 26.5);
  doc.setTextColor(effectiveBalance > 0 ? 220 : 18, effectiveBalance > 0 ? 38 : 184, effectiveBalance > 0 ? 38 : 176);
  doc.text(`$${effectiveBalance.toFixed(2)}`, summaryX + summaryWidth - 4, blockY + 26.5, {
    align: 'right',
  });

  // Footer
  doc.setDrawColor(221, 227, 234);
  doc.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(126, 142, 159);
  doc.text(
    'PlyAqua Official Sale Invoice • Generated electronically',
    marginX,
    pageHeight - 10
  );
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    pageWidth - marginX,
    pageHeight - 10,
    { align: 'right' }
  );

  // Trigger download with target="_blank"
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `${bill.bill_id || 'sale_invoice'}.pdf`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 1500);
}
