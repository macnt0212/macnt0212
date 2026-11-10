import { Quote } from '../types';
import { COMPANY_INFO, COMPANY_SIGNATURE_FALLBACK } from './companyConfig';
import { getStoredTeamMembers } from './storage';
import { formatCurrency } from './pdfGenerator';

export interface EmailPayload {
  to: string;
  cc: string[];
  subject: string;
  body: string;
  quoteCode: string;
  attachPdf: boolean;
}

export function generateEmailTemplate(quote: Quote): { subject: string; body: string; suggestedCc: string[] } {
  const isLicitacion = quote.type === 'licitacion';
  const members = getStoredTeamMembers();
  const assigned = members.find(m => m.id === quote.assignedTo) || members[0] || COMPANY_SIGNATURE_FALLBACK;

  const subject = isLicitacion
    ? `[OFERTA LICITACIÓN ${quote.code}] ${COMPANY_INFO.name} - ${quote.biddingDetails?.docketNumber || quote.title}`
    : `[PRESUPUESTO ${quote.code}] ${COMPANY_INFO.name} - ${quote.title}`;

  const suggestedCc = [
    assigned.email,
    COMPANY_INFO.email,
    'gerencia@solucionesintegrales.com.ar'
  ];

  const body = `Estimado/a ${quote.clientContactPerson || 'Representante'}:

Por medio de la presente, desde ${COMPANY_INFO.name} (CUIT ${COMPANY_INFO.formattedCuit}) tenemos el agrado de remitirle nuestra propuesta formal ${quote.code} correspondiente a:

"${quote.title}"

${isLicitacion && quote.biddingDetails ? `
RESUMEN DEL PLIEGO Y PRESENTACIÓN:
• Organismo Convocante: ${quote.biddingDetails.agencyName}
• Pliego / Expediente N°: ${quote.biddingDetails.docketNumber}
• Fecha y Hora de Apertura: ${quote.biddingDetails.openingDate} a las ${quote.biddingDetails.openingTime} hs
• Lugar de Apertura: ${quote.biddingDetails.openingPlace}
• Garantía de Oferta: ${quote.biddingDetails.guaranteePercentage || 1}% constituidos en póliza de caución
` : ''}
DATOS ECONÓMICOS:
• Subtotal: ${formatCurrency(quote.subtotal, quote.currency)}
• I.V.A.: ${formatCurrency(quote.taxAmount, quote.currency)}
• MONTO TOTAL OFERTADO: ${formatCurrency(quote.total, quote.currency)}

CONDICIONES GENERALES:
• Plazo de entrega / ejecución: ${quote.deliveryTerms}
• Condición de pago: ${quote.paymentTerms}
• Validez de la oferta: ${quote.validUntil ? quote.validUntil : '30 días corridos'}
• Garantía: ${quote.warrantyTerms}

Se adjunta el documento electrónico oficial correlativo en formato PDF debidamente rubricado por nuestra dirección técnica.

Quedamos a su entera disposición ante cualquier duda o requerimiento aclaratorio.

Atentamente,

${assigned.name}
${assigned.role}
${COMPANY_INFO.name}
CUIT: ${COMPANY_INFO.formattedCuit}
Tel: ${COMPANY_INFO.phone}
${COMPANY_INFO.website}
`;

  return { subject, body, suggestedCc };
}

export async function sendEmailNotification(payload: EmailPayload): Promise<{ success: boolean; message: string }> {
  // Simulate network dispatch with realistic latency
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    success: true,
    message: `Correo electrónico despachado exitosamente a ${payload.to} con copia a ${payload.cc.join(', ')}.`
  };
}
