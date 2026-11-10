import { CompanyInfo, TeamMember } from '../types';
import companyLogo from '../assets/logo-soluciones-integrales.png';
import { LOGO_BASE64 } from './logoBase64';

// El logo oficial de Soluciones Integrales en Base64 garantiza que se visualice
// de manera idéntica e infalible tanto en local, en GitHub, GitHub Pages y en el PDF.
export const COMPANY_LOGO_URL = LOGO_BASE64 || companyLogo;

export const COMPANY_INFO: CompanyInfo = {
  name: "Soluciones Integrales",
  cuit: "20427579043",
  formattedCuit: "20-42757904-3",
  activity: "Informática · Redes · Seguridad · Electricidad",
  tagline: "INFORMÁTICA · REDES · SEGURIDAD · ELECTRICIDAD",
  address: "Av. Corrientes 1450, Piso 8, Of. B",
  city: "Ciudad Autónoma de Buenos Aires (C1042AAP)",
  phone: "370 464-6635",
  email: "macnt0212@gmail.com",
  website: "www.solucionesintegrales.com.ar",
  taxCondition: "IVA Responsable Inscripto",
  grossIncome: "901-20427579-0 (Convenio Multilateral)",
  logoUrl: COMPANY_LOGO_URL,
  bankDetails: {
    bank: "Banco Santander Argentina",
    accountType: "Cuenta Corriente Especial en Pesos",
    cbu: "0720042720000042757904",
    alias: "SOLUCIONES.INTEGRALES.CO"
  }
};

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [];

export const COMPANY_SIGNATURE_FALLBACK: TeamMember = {
  id: "general",
  name: "Soluciones Integrales - Dirección Comercial",
  role: "Responsable Comercial y Técnico",
  email: COMPANY_INFO.email,
  avatarColor: "bg-slate-700"
};

export const KANBAN_COLUMNS = [
  { id: 'borrador', title: 'Borrador', description: 'En formulación de costos', color: 'slate', dot: 'bg-slate-400' },
  { id: 'revision', title: 'En Revisión', description: 'Auditoría técnica y de pliego', color: 'amber', dot: 'bg-amber-500' },
  { id: 'presentada', title: 'Presentada / Enviada', description: 'Ingresada al cliente u organismo', color: 'blue', dot: 'bg-blue-500' },
  { id: 'evaluacion', title: 'En Evaluación / Apertura', description: 'Apertura de ofertas y dictamen', color: 'purple', dot: 'bg-purple-500' },
  { id: 'adjudicada', title: 'Adjudicada (Ganada)', description: 'Orden de compra confirmada', color: 'emerald', dot: 'bg-emerald-500' },
  { id: 'rechazada', title: 'No Adjudicada', description: 'Desestimada o rechazada', color: 'rose', dot: 'bg-rose-500' },
  { id: 'vencida', title: 'Vencida', description: 'Plazo expirado sin adjudicación', color: 'zinc', dot: 'bg-zinc-400' }
] as const;

export const BUDGET_TEMPLATES: import('../types').QuoteTemplate[] = [
  {
    id: "tpl-rapido-vacio",
    name: "Presupuesto Rápido (En Blanco)",
    description: "Plantilla limpia para cargar costo base con +20% o +30% de rentabilidad y 21% de IVA.",
    category: "General",
    defaultTitle: "Presupuesto Estimativo de Suministro y Servicios",
    currency: "ARS",
    items: [
      {
        code: "ITEM-01",
        description: "Provisión e instalación integral de equipamiento y materiales",
        unit: "global",
        quantity: 1,
        cost: 1000000,
        profitMargin: 20,
        unitPrice: 1200000,
        taxRate: 21,
        subtotal: 1200000
      }
    ],
    paymentTerms: "Contra entrega y el resto a 30 días.",
    deliveryTerms: "Los equipos se entregan a partir del primer pago.",
    warrantyTerms: "12 meses de garantía oficial sobre componentes y mano de obra."
  },
  {
    id: "tpl-cableado-redes",
    name: "Cableado Estructurado y Redes",
    description: "Instalación de bocas de red Cat 6A, patch cords, rack y certificación con margen del 20% y 25%.",
    category: "Telecomunicaciones",
    defaultTitle: "Instalación y Certificación de Cableado Estructurado Cat 6A",
    currency: "ARS",
    items: [
      {
        code: "RED-CAT6A",
        description: "Puntos dobles de red Categoría 6A UTP Furukawa / CommScope con jack RJ45 y placa de pared",
        unit: "u",
        quantity: 24,
        cost: 70833,
        profitMargin: 20,
        unitPrice: 85000,
        taxRate: 21,
        subtotal: 2040000
      },
      {
        code: "RACK-24U",
        description: "Gabinete mural de comunicaciones 24U con organizadores horizontales y PDU termomagnética",
        unit: "u",
        quantity: 1,
        cost: 760000,
        profitMargin: 25,
        unitPrice: 950000,
        taxRate: 21,
        subtotal: 950000
      },
      {
        code: "CERT-FLUKE",
        description: "Certificación con instrumental Fluke Networks y entrega de dossier técnico digital",
        unit: "global",
        quantity: 1,
        cost: 350000,
        profitMargin: 20,
        unitPrice: 420000,
        taxRate: 21,
        subtotal: 420000
      }
    ],
    paymentTerms: "Contra entrega y el resto a 30 días.",
    deliveryTerms: "Los equipos se entregan a partir del primer pago.",
    warrantyTerms: "25 años de garantía de enlace sobre componentes y 2 años en mano de obra."
  },
  {
    id: "tpl-mantenimiento-preventivo",
    name: "Abono Mensual de Mantenimiento",
    description: "Servicio preventivo periódico con guardias pasivas 24/7 con rentabilidad del 30% y 21% de IVA.",
    category: "Servicios",
    defaultTitle: "Abono Mensual de Mantenimiento Preventivo y Asistencia Técnica 24/7",
    currency: "ARS",
    items: [
      {
        code: "ABON-MENS-01",
        description: "Visita técnica mensual programada de inspección, calibración y reporte de estado",
        unit: "mes",
        quantity: 6,
        cost: 500000,
        profitMargin: 30,
        unitPrice: 650000,
        taxRate: 21,
        subtotal: 3900000
      },
      {
        code: "GUARD-24-02",
        description: "Guardia pasiva 24/7 con tiempo de respuesta en planta menor a 3 horas ante urgencias",
        unit: "mes",
        quantity: 6,
        cost: 215385,
        profitMargin: 30,
        unitPrice: 280000,
        taxRate: 21,
        subtotal: 1680000
      }
    ],
    paymentTerms: "Contra entrega y el resto a 30 días.",
    deliveryTerms: "Los equipos se entregan a partir del primer pago.",
    warrantyTerms: "Continuidad operativa y cobertura de seguro de ART y responsabilidad civil."
  },
  {
    id: "tpl-obra-electrica",
    name: "Tablero Eléctrico y Distribución",
    description: "Armado de tablero con protecciones Schneider, cableado ignífugo, rentabilidad del 20% al 30% e IVA 21%.",
    category: "Electricidad",
    defaultTitle: "Adecuación de Tablero General de Distribución y Medición de PAT",
    currency: "ARS",
    items: [
      {
        code: "TAB-GEN-01",
        description: "Gabinete estanco IP65 con interruptor termomagnético 4x63A y disyuntores diferenciales Schneider",
        unit: "u",
        quantity: 1,
        cost: 1750000,
        profitMargin: 20,
        unitPrice: 2100000,
        taxRate: 21,
        subtotal: 2100000
      },
      {
        code: "PAT-JAB-02",
        description: "Instalación de jabalina de puesta a tierra con cámara de inspección y protocolo COPIME",
        unit: "u",
        quantity: 1,
        cost: 483333,
        profitMargin: 20,
        unitPrice: 580000,
        taxRate: 21,
        subtotal: 580000
      },
      {
        code: "MO-ELECT-03",
        description: "Mano de obra especializada con técnicos matriculados y seguro de ART para obra",
        unit: "global",
        quantity: 1,
        cost: 684615,
        profitMargin: 30,
        unitPrice: 890000,
        taxRate: 21,
        subtotal: 890000
      }
    ],
    paymentTerms: "Contra entrega y el resto a 30 días.",
    deliveryTerms: "Los equipos se entregan a partir del primer pago.",
    warrantyTerms: "Garantía total de instalación eléctrica por 24 meses corridos."
  }
];
