export type QuoteType = 'privada' | 'licitacion';

export type QuoteStatus = 
  | 'borrador'
  | 'revision'
  | 'presentada'
  | 'evaluacion'
  | 'adjudicada'
  | 'rechazada'
  | 'vencida';

export interface QuoteItem {
  id: string;
  code?: string;
  description: string;
  unit: string; // 'u', 'hs', 'global', 'mes', 'm²', 'kg'
  quantity: number;
  cost?: number; // Costo base unitario de compra / provisión
  profitMargin?: number; // % de rentabilidad / margen deseado (ej: 20, 30 o libre)
  unitPrice: number; // Precio de venta unitario neto = cost * (1 + profitMargin / 100)
  taxRate: number; // IVA %: 0, 10.5, 21, 27 (por defecto 21)
  subtotal: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
}

export interface Quote {
  id: string;
  code: string; // e.g. "COT-2026-0001" or "LIC-2026-0002"
  revision: number; // 1, 2, ...
  type: QuoteType;
  status: QuoteStatus;
  title: string; // Objeto del presupuesto / Descripción corta
  createdAt: string; // ISO date
  updatedAt: string;
  validUntil: string; // Fecha de validez de la oferta
  
  // Cliente / Organismo
  clientName: string;
  clientCuit: string;
  clientContactPerson: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;

  // Campos específicos de Licitación Estatal
  biddingDetails?: {
    agencyName: string; // Organismo convocante (ej. Ministerio de Obras Públicas)
    docketNumber: string; // N° de Expediente / Pliego (ej. "EX-2026-451299-APN-DGA#MOP")
    biddingType: 'Licitación Pública' | 'Licitación Privada' | 'Contratación Directa' | 'Concurso de Precios';
    openingDate: string; // Fecha de apertura de ofertas YYYY-MM-DD
    openingTime: string; // Hora HH:mm
    openingPlace: string; // Lugar o plataforma (ej: "COMPR.AR / Sala de Aperturas")
    guaranteePercentage?: number; // % Mantenimiento de oferta (ej 1%, 5%)
    guaranteeAmount?: number; // Monto de garantía de oferta
    submissionAddress?: string;
    clarificationDeadline?: string; // Fecha límite para consultas de pliego
  };

  // Moneda e Items
  currency: 'ARS' | 'USD';
  exchangeRate?: number; // Tipo de cambio si USD
  items: QuoteItem[];
  
  // Cálculos de rentabilidad y montos fiscales
  totalCost?: number;
  totalProfit?: number;
  profitPercentage?: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxAmount: number;
  taxBreakdown: { [rate: number]: number }; // breakdown por 10.5, 21, etc.
  total: number;

  // Condiciones Comerciales
  paymentTerms: string; // ej. "Contra entrega y el resto a 30 días."
  deliveryTerms: string; // ej. "Los equipos se entregan a partir del primer pago."
  warrantyTerms: string; // ej. "12 meses de garantía oficial"
  notes?: string;

  // Datos Bancarios Personalizados
  bank?: string;
  cbu?: string;
  alias?: string;

  // Gestión de Equipo y Seguimiento
  assignedTo: string; // TeamMember id
  leadTechnician?: string;
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  tags: string[];
  activityLog: ActivityEntry[];
  
  // Emails enviados
  sentEmailsCount: number;
  lastSentAt?: string;
  isQuickQuote?: boolean; // Presupuestado sin datos de cliente
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultTitle: string;
  currency: 'ARS' | 'USD';
  items: Omit<QuoteItem, 'id'>[];
  paymentTerms: string;
  deliveryTerms: string;
  warrantyTerms: string;
}

export interface AppNotification {
  id: string;
  quoteId?: string;
  quoteCode?: string;
  type: 'urgent_deadline' | 'status_change' | 'email_sent' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'info' | 'warning' | 'alert';
}

export interface CompanyInfo {
  name: string;
  cuit: string;
  formattedCuit: string;
  activity: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  taxCondition: string;
  grossIncome: string; // Ingresos Brutos
  logoUrl?: string;
  tagline?: string;
  bankDetails: {
    bank: string;
    accountType: string;
    cbu: string;
    alias: string;
  };
}
