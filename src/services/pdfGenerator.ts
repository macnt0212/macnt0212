import { jsPDF } from 'jspdf';
import { Quote } from '../types';
import { COMPANY_INFO, COMPANY_SIGNATURE_FALLBACK } from './companyConfig';
import { getStoredTeamMembers } from './storage';
import { LOGO_BASE64 } from './logoBase64';

/**
 * Formatea importes monetarios estrictamente en formato argentino:
 * Símbolo de moneda ($ o USD), miles separados por punto (.) y dos decimales separados por coma (,)
 * Ejemplos:
 *  1250000 -> "$ 1.250.000,00"
 *  3500.5  -> "$ 3.500,50"
 *  0       -> "$ 0,00"
 */
export function formatCurrency(amount: number | undefined | null, currency: 'ARS' | 'USD' = 'ARS'): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const fixed = absNum.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const prefix = currency === 'USD' ? 'USD' : '$';
  const sign = isNegative ? '-' : '';
  return `${sign}${prefix} ${formattedInt},${decPart}`;
}

/**
 * Formatea un número en formato argentino (miles con punto y dos decimales con coma) sin símbolo:
 * Ejemplos:
 *  1250000  -> "1.250.000,00"
 *  3500.5   -> "3.500,50"
 *  0        -> "0,00"
 */
export function formatMoneyString(amount: number | undefined | null): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00';
  const isNegative = amount < 0;
  const absNum = Math.abs(amount);
  const fixed = absNum.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}${formattedInt},${decPart}`;
}

/**
 * Parsea cualquier cadena o número con formato argentino a float numérico:
 * Soporta "1.250.000,50", "1250000,50", "1250000.50", "1.250.000", etc.
 */
export function parseMoneyString(input: string | number | undefined | null): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  let str = String(input).trim().replace(/[$USD\s]/gi, '');
  if (!str) return 0;

  // Si contiene tanto punto como coma:
  // "1.250.000,50" -> los puntos son miles, la coma es decimal
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // "1250000,50" -> coma es decimal
    str = str.replace(',', '.');
  } else if (str.includes('.')) {
    // Si tiene más de un punto, como "1.250.000", todos son miles
    const parts = str.split('.');
    if (parts.length > 2) {
      str = parts.join('');
    } else if (parts.length === 2 && parts[1].length === 3 && Number(parts[0]) > 0) {
      // Como "1.250"
      str = parts.join('');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function formatQuantity(qty: number | undefined | null): string {
  const num = typeof qty === 'number' && !isNaN(qty) ? qty : 0;
  if (Number.isInteger(num)) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  const [intPart, decPart] = num.toFixed(2).replace(/0+$/, '').split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart ? `${formattedInt},${decPart}` : formattedInt;
}

export function generateQuotePDF(quote: Quote): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  const primaryColor: [number, number, number] = [15, 44, 89]; // Deep Navy #0F2C59
  const accentColor: [number, number, number] = [37, 99, 235]; // Royal Blue #2563EB
  const slateDark: [number, number, number] = [30, 41, 59]; // Slate 800
  const slateLight: [number, number, number] = [241, 245, 249]; // Slate 100
  const grayBorder: [number, number, number] = [203, 213, 225]; // Slate 300

  // 1. Top Bar Decoration
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 6, 'F');

  // 2. Company Brand & Header
  let y = 12;

  // Render Official Brand Logo (Futuristic Soluciones Integrales - 2:1 aspect ratio)
  const logoWidth = 46;
  const logoHeight = 23;
  try {
    doc.addImage(LOGO_BASE64, 'PNG', margin, y, logoWidth, logoHeight);
  } catch (err) {
    // Fallback if image fails
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin, y, 14, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SI', margin + 3.5, y + 9.5);
  }

  // Company Tax & Activity details
  const textX = margin + 49;
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(COMPANY_INFO.name.toUpperCase(), textX, y + 4.5);

  doc.setTextColor(2, 132, 199); // Sky / Cyan tone matching logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('INFORMÁTICA · REDES · SEGURIDAD · ELECTRICIDAD', textX, y + 8.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(`CUIT: ${COMPANY_INFO.formattedCuit}`, textX, y + 12.5);
  doc.text(COMPANY_INFO.taxCondition, textX, y + 16);
  doc.text(`Tel: ${COMPANY_INFO.phone}`, textX, y + 19.5);
  doc.text(`Email: ${COMPANY_INFO.email}`, textX, y + 23);

  // Right Box: Document Type & Number
  const rightBoxWidth = 72;
  const rightBoxX = pageWidth - margin - rightBoxWidth;
  doc.setFillColor(...slateLight);
  doc.setDrawColor(...grayBorder);
  doc.roundedRect(rightBoxX, y, rightBoxWidth, 24, 2, 2, 'FD');

  doc.setTextColor(...accentColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const docTypeLabel = quote.type === 'licitacion' ? 'OFERTA DE LICITACIÓN' : 'PRESUPUESTO OFICIAL';
  doc.text(docTypeLabel, rightBoxX + 5, y + 6);

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(quote.code, rightBoxX + 5, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const emissionDate = new Date(quote.createdAt).toLocaleDateString('es-AR');
  const validUntilDate = quote.validUntil ? new Date(quote.validUntil + 'T12:00:00').toLocaleDateString('es-AR') : '30 días';
  doc.text(`Fecha Emisión: ${emissionDate}`, rightBoxX + 5, y + 17.5);
  doc.text(`Validez de Oferta: ${validUntilDate}`, rightBoxX + 5, y + 22);

  y += 28;

  // 3. Client / Government Agency Box
  doc.setDrawColor(...grayBorder);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  const isGenericClient = quote.isQuickQuote || !quote.clientName || quote.clientName.includes('Consumidor Final') || quote.clientName.includes('Cliente a Designar');

  if (isGenericClient && quote.type !== 'licitacion') {
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DESTINATARIO: A DISPOSICIÓN / CLIENTE A DESIGNAR', margin + 4, y + 5);

    doc.setTextColor(...slateDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(quote.clientName || 'Consumidor Final / Cliente a Designar', margin + 4, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Condición Fiscal: Consumidor Final / Presupuesto Modelo', margin + 4, y + 15);
    doc.text('Destino / Entrega: A coordinar según requerimiento de obra', margin + 4, y + 19);

    const midClientX = margin + (contentWidth / 2) + 5;
    doc.text('Atención: Área de Compras / A quien corresponda', midClientX, y + 10);
    doc.text(`Consultas: ${COMPANY_INFO.email}`, midClientX, y + 15);
    doc.text(`Teléfono: ${COMPANY_INFO.phone}`, midClientX, y + 19);
  } else {
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(quote.type === 'licitacion' ? 'ORGANISMO CONVOCANTE / COMITENTE:' : 'CLIENTE / DESTINATARIO:', margin + 4, y + 5);

    doc.setTextColor(...slateDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(quote.clientName || 'Cliente no especificado', margin + 4, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`CUIT/RUT: ${quote.clientCuit || 'Consumidor Final / Sin CUIT'}`, margin + 4, y + 15);
    doc.text(`Dirección: ${quote.clientAddress || 'No especificada'}`, margin + 4, y + 19);

    // Right column of client box
    const midClientX = margin + (contentWidth / 2) + 5;
    doc.text(`Contacto: ${quote.clientContactPerson || 'Mesa de Entradas / Compras'}`, midClientX, y + 10);
    doc.text(`Email: ${quote.clientEmail || '-'}`, midClientX, y + 15);
    doc.text(`Teléfono: ${quote.clientPhone || '-'}`, midClientX, y + 19);
  }

  y += 25;

  // 4. Special Banner for Licitaciones del Estado
  if (quote.type === 'licitacion' && quote.biddingDetails) {
    const bd = quote.biddingDetails;
    doc.setFillColor(238, 242, 255); // Indigo 50
    doc.setDrawColor(199, 210, 254); // Indigo 200
    doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'FD');

    // Left indicator bar
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(margin, y, 3, 25, 'F');

    doc.setTextColor(67, 56, 202);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`DATOS DEL PLIEGO Y APERTURA DE SOBRES - ${bd.biddingType.toUpperCase()}`, margin + 6, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    doc.setFont('helvetica', 'bold');
    doc.text('Pliego / Expediente N°:', margin + 6, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(bd.docketNumber || 'A designar', margin + 42, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha y Hora de Apertura:', margin + 6, y + 15);
    doc.setFont('helvetica', 'normal');
    const openingFormatted = bd.openingDate ? `${new Date(bd.openingDate + 'T12:00:00').toLocaleDateString('es-AR')} a las ${bd.openingTime || '10:00'} hs` : 'A confirmar';
    doc.setTextColor(185, 28, 28); // Red text for opening urgency
    doc.setFont('helvetica', 'bold');
    doc.text(openingFormatted, margin + 45, y + 15);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Lugar de Apertura:', margin + 6, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(bd.openingPlace || 'Plataforma oficial', margin + 35, y + 20);

    // Right column of bidding details
    const rightBiddingX = margin + (contentWidth / 2) + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Garantía de Oferta:', rightBiddingX, y + 10);
    doc.setFont('helvetica', 'normal');
    const guaranteeText = bd.guaranteePercentage 
      ? `${bd.guaranteePercentage}% (${formatCurrency(bd.guaranteeAmount || (quote.total * bd.guaranteePercentage / 100), quote.currency)})` 
      : 'Según cláusulas del pliego';
    doc.text(guaranteeText, rightBiddingX + 30, y + 10);

    if (bd.clarificationDeadline) {
      doc.setFont('helvetica', 'bold');
      doc.text('Límite de Consultas:', rightBiddingX, y + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(bd.clarificationDeadline + 'T12:00:00').toLocaleDateString('es-AR'), rightBiddingX + 32, y + 15);
    }

    y += 28;
  }

  // 5. Title / Purpose of quote
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('OBJETO DE LA COTIZACIÓN:', margin, y + 3);

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const titleLines = doc.splitTextToSize(quote.title, contentWidth);
  doc.text(titleLines, margin, y + 7.5);

  y += 7.5 + (titleLines.length * 4) + 2;

  // 6. Items Table Header
  const tableHeaders = [
    { title: 'Ítem', width: 9, align: 'center' },
    { title: 'Código', width: 17, align: 'left' },
    { title: 'Descripción y Especificaciones', width: 64, align: 'left' },
    { title: 'Unid.', width: 10, align: 'center' },
    { title: 'Cant.', width: 13, align: 'right' },
    { title: 'P. Unitario', width: 25, align: 'right' },
    { title: 'IVA', width: 12, align: 'center' },
    { title: 'Subtotal Neto', width: 32, align: 'right' }
  ];

  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  let curX = margin;
  tableHeaders.forEach(th => {
    let textX = curX + 1.5;
    if (th.align === 'center') textX = curX + (th.width / 2);
    if (th.align === 'right') textX = curX + th.width - 1.5;
    doc.text(th.title, textX, y + 4.5, { align: th.align as any });
    curX += th.width;
  });

  y += 7;

  // 7. Table Rows
  quote.items.forEach((item, index) => {
    // Check if we need a new page
    if (y > pageHeight - 55) {
      doc.addPage();
      y = 15;
    }

    const rowBg = index % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    
    // Calculate text wrapping for description (64mm col width - 3mm padding = 61mm)
    const descLines = doc.splitTextToSize(item.description, 61);
    const rowHeight = Math.max(7, 3 + (descLines.length * 3.5));

    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setDrawColor(...grayBorder);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setTextColor(...slateDark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    let cellX = margin;

    // Item #
    doc.text(String(index + 1), cellX + 4.5, y + 4.5, { align: 'center' });
    cellX += 9;

    // Code
    doc.text(item.code || '-', cellX + 1.5, y + 4.5);
    cellX += 17;

    // Description
    doc.text(descLines, cellX + 1.5, y + 4.5);
    cellX += 64;

    // Unit
    doc.text(item.unit || 'u', cellX + 5, y + 4.5, { align: 'center' });
    cellX += 10;

    // Quantity
    doc.text(formatQuantity(item.quantity), cellX + 11.5, y + 4.5, { align: 'right' });
    cellX += 13;

    // Unit Price
    doc.text(formatCurrency(item.unitPrice, quote.currency), cellX + 23.5, y + 4.5, { align: 'right' });
    cellX += 25;

    // IVA %
    doc.text(`${item.taxRate ?? 21}%`, cellX + 6, y + 4.5, { align: 'center' });
    cellX += 12;

    // Subtotal Neto (32mm width provides ample breathing room, perfectly within margins)
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.subtotal, quote.currency), cellX + 30.5, y + 4.5, { align: 'right' });

    y += rowHeight;
  });

  y += 4;

  // 8. Totals and Summary Box
  if (y > pageHeight - 65) {
    doc.addPage();
    y = 15;
  }

  const totalsBoxWidth = 85;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  doc.setDrawColor(...grayBorder);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsBoxX, y, totalsBoxWidth, 26, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal Neto Gravado:', totalsBoxX + 4, y + 5);
  doc.text(formatCurrency(quote.subtotal, quote.currency), totalsBoxX + totalsBoxWidth - 4, y + 5, { align: 'right' });

  // Descuento if any
  if (quote.discountAmount > 0) {
    doc.text(`Bonificación / Descuento (${quote.discountPercentage}%):`, totalsBoxX + 4, y + 9);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatCurrency(quote.discountAmount, quote.currency)}`, totalsBoxX + totalsBoxWidth - 4, y + 9, { align: 'right' });
    doc.setTextColor(71, 85, 105);
  }

  // IVA
  doc.text('I.V.A. Total:', totalsBoxX + 4, y + 13);
  doc.text(formatCurrency(quote.taxAmount, quote.currency), totalsBoxX + totalsBoxWidth - 4, y + 13, { align: 'right' });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsBoxX + 2, y + 17, totalsBoxX + totalsBoxWidth - 2, y + 17);

  // Total Final
  doc.setFillColor(...primaryColor);
  doc.roundedRect(totalsBoxX + 2, y + 18, totalsBoxWidth - 4, 7, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL A PAGAR:', totalsBoxX + 5, y + 23);
  doc.text(formatCurrency(quote.total, quote.currency), totalsBoxX + totalsBoxWidth - 5, y + 23, { align: 'right' });

  // Left side: Commercial Conditions
  const conditionsWidth = contentWidth - totalsBoxWidth - 6;
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONDICIONES COMERCIALES Y CLÁUSULAS:', margin, y + 5);

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let condY = y + 9;
  
  const paymentText = quote.paymentTerms || 'Contra entrega y el resto a 30 días.';
  const deliveryText = quote.deliveryTerms || 'Los equipos se entregan a partir del primer pago.';
  const warrantyText = quote.warrantyTerms || '12 meses de garantía oficial sobre componentes y mano de obra.';
  const bankName = quote.bank || COMPANY_INFO.bankDetails.bank;
  const bankCbu = quote.cbu || COMPANY_INFO.bankDetails.cbu;
  const bankAlias = quote.alias || COMPANY_INFO.bankDetails.alias;

  doc.text(`• Condición de Pago: ${paymentText}`, margin, condY);
  condY += 4;
  doc.text(`• Plazo y Lugar de Entrega: ${deliveryText}`, margin, condY);
  condY += 4;
  doc.text(`• Garantía Técnica: ${warrantyText}`, margin, condY);
  condY += 4;
  doc.text(`• CBU Pagos: ${bankCbu} (${bankName})${bankAlias ? ` | Alias: ${bankAlias}` : ''}`, margin, condY);

  y += 32;

  // 9. Signatures and Validation Seals
  if (y > pageHeight - 38) {
    doc.addPage();
    y = 20;
  }

  const storedMembers = getStoredTeamMembers();
  const assignedMember = storedMembers.find(m => m.id === quote.assignedTo) || storedMembers[0] || COMPANY_SIGNATURE_FALLBACK;

  // Seal / Sign box Left (Soluciones Integrales)
  const signBoxWidth = 75;
  doc.setDrawColor(...grayBorder);
  doc.line(margin + 5, y + 14, margin + signBoxWidth - 5, y + 14);
  
  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(assignedMember.name, margin + (signBoxWidth / 2), y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${assignedMember.role} - Soluciones Integrales`, margin + (signBoxWidth / 2), y + 21, { align: 'center' });
  doc.text(`CUIT: ${COMPANY_INFO.formattedCuit}`, margin + (signBoxWidth / 2), y + 24, { align: 'center' });

  // Customer Acceptance Right Box
  const custSignX = pageWidth - margin - signBoxWidth;
  doc.setDrawColor(...grayBorder);
  doc.line(custSignX + 5, y + 14, custSignX + signBoxWidth - 5, y + 14);

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Firma y Sello de Conformidad / Comitente', custSignX + (signBoxWidth / 2), y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Aclaración, Cargo y Fecha de Recepción', custSignX + (signBoxWidth / 2), y + 21, { align: 'center' });

  // Footer bar on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Soluciones Integrales | CUIT ${COMPANY_INFO.formattedCuit} | Documento Electrónico Correlativo ${quote.code} | Rev. ${quote.revision}`, margin, pageHeight - 3);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: 'right' });
  }

  return doc;
}

export function downloadQuotePDF(quote: Quote) {
  const doc = generateQuotePDF(quote);
  const fileName = `${quote.code}_Soluciones_Integrales_${quote.clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}.pdf`;
  doc.save(fileName);
}

export function printQuotePDF(quote: Quote) {
  const doc = generateQuotePDF(quote);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  const urlStr = String(blobUrl);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = urlStr;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Fallback
    }
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {
        // ignore
      }
      URL.revokeObjectURL(urlStr);
    }, 60000);
  };
}
