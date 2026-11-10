import { Quote, AppNotification, TeamMember } from '../types';
import { COMPANY_INFO } from './companyConfig';

const STORAGE_KEY = 'soluciones_integrales_quotes_v2';
const NOTIFICATIONS_KEY = 'soluciones_integrales_notifications_v2';
const TEAM_MEMBERS_KEY = 'soluciones_integrales_team_members_v2';
const BANK_DETAILS_KEY = 'soluciones_integrales_bank_details_v2';

export interface CustomBankDetails {
  bank: string;
  cbu: string;
  alias?: string;
}

export function getStoredBankDetails(): CustomBankDetails {
  try {
    if (typeof localStorage === 'undefined') {
      return {
        bank: COMPANY_INFO.bankDetails.bank,
        cbu: COMPANY_INFO.bankDetails.cbu,
        alias: COMPANY_INFO.bankDetails.alias
      };
    }
    const raw = localStorage.getItem(BANK_DETAILS_KEY);
    if (!raw) {
      return {
        bank: COMPANY_INFO.bankDetails.bank,
        cbu: COMPANY_INFO.bankDetails.cbu,
        alias: COMPANY_INFO.bankDetails.alias
      };
    }
    const parsed = JSON.parse(raw);
    return {
      bank: parsed.bank || COMPANY_INFO.bankDetails.bank,
      cbu: parsed.cbu || COMPANY_INFO.bankDetails.cbu,
      alias: parsed.alias || COMPANY_INFO.bankDetails.alias
    };
  } catch {
    return {
      bank: COMPANY_INFO.bankDetails.bank,
      cbu: COMPANY_INFO.bankDetails.cbu,
      alias: COMPANY_INFO.bankDetails.alias
    };
  }
}

export function saveStoredBankDetails(details: CustomBankDetails): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(details));
    }
  } catch (err) {
    console.error("Error saving bank details:", err);
  }
}

// Automatic cleanup of legacy demo data from v1 keys
try {
  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem('soluciones_integrales_quotes_v1')) {
      localStorage.removeItem('soluciones_integrales_quotes_v1');
    }
    if (localStorage.getItem('soluciones_integrales_notifications_v1')) {
      localStorage.removeItem('soluciones_integrales_notifications_v1');
    }
    if (localStorage.getItem('soluciones_integrales_team_members_v1')) {
      localStorage.removeItem('soluciones_integrales_team_members_v1');
    }
  }
} catch (e) {
  // Ignore in SSR
}

// Team Members Storage
export function getStoredTeamMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(TEAM_MEMBERS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading stored team members:", err);
    return [];
  }
}

export function saveTeamMembers(members: TeamMember[]): void {
  try {
    localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(members));
    window.dispatchEvent(new CustomEvent('team-members-updated', { detail: members }));
  } catch (err) {
    console.error("Error saving team members:", err);
  }
}

export function addTeamMember(data: Omit<TeamMember, 'id'>): TeamMember {
  const current = getStoredTeamMembers();
  const newMember: TeamMember = {
    ...data,
    id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  };
  const updated = [...current, newMember];
  saveTeamMembers(updated);
  return newMember;
}

export function deleteTeamMember(id: string): void {
  const current = getStoredTeamMembers();
  const updated = current.filter(m => m.id !== id);
  saveTeamMembers(updated);
}

export function clearAllTeamMembers(): void {
  saveTeamMembers([]);
}

export function calculateTotals(items: Quote['items'], discountPercentage = 0) {
  let subtotal = 0;
  let totalCost = 0;
  const taxBreakdown: { [rate: number]: number } = {};

  items.forEach(item => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const itemSubtotal = qty * unitPrice;
    subtotal += itemSubtotal;
    
    // Costo base por ítem
    const unitCost = typeof item.cost === 'number' && !isNaN(item.cost) && item.cost > 0
      ? item.cost
      : (typeof item.profitMargin === 'number' && item.profitMargin > 0
          ? unitPrice / (1 + item.profitMargin / 100)
          : unitPrice);
    totalCost += qty * unitCost;

    // Tax per item (por defecto 21%)
    const rate = typeof item.taxRate === 'number' ? item.taxRate : 21;
    const tax = itemSubtotal * (rate / 100);
    taxBreakdown[rate] = (taxBreakdown[rate] || 0) + tax;
  });

  const discountAmount = subtotal * (discountPercentage / 100);
  const discountedSubtotal = subtotal - discountAmount;
  
  // Recalculate tax with discount applied proportionally
  let taxAmount = 0;
  const discountFactor = subtotal > 0 ? (discountedSubtotal / subtotal) : 1;
  const adjustedTaxBreakdown: { [rate: number]: number } = {};
  
  Object.keys(taxBreakdown).forEach(key => {
    const rate = Number(key);
    const adjusted = taxBreakdown[rate] * discountFactor;
    adjustedTaxBreakdown[rate] = adjusted;
    taxAmount += adjusted;
  });

  const total = discountedSubtotal + taxAmount;
  const totalProfit = discountedSubtotal - totalCost;
  const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  return {
    totalCost,
    totalProfit,
    profitPercentage,
    subtotal,
    discountAmount,
    taxAmount,
    taxBreakdown: adjustedTaxBreakdown,
    total
  };
}

export function getNextQuoteCode(type: 'privada' | 'licitacion', existingQuotes: Quote[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = type === 'licitacion' ? `LIC-${currentYear}-` : `COT-${currentYear}-`;
  
  // Find highest number with this prefix
  let maxNumber = 0;
  existingQuotes.forEach(q => {
    if (q.code && q.code.startsWith(prefix)) {
      const part = q.code.replace(prefix, '');
      const num = parseInt(part, 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  });

  const nextNumber = maxNumber + 1;
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

const INITIAL_QUOTES: Quote[] = [];

export function getStoredQuotes(): Quote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveQuotes([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading stored quotes:", err);
    return [];
  }
}

export function saveQuotes(quotes: Quote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    window.dispatchEvent(new CustomEvent('quotes-updated', { detail: quotes }));
  } catch (err) {
    console.error("Error saving quotes:", err);
  }
}

export function saveQuote(quote: Quote): Quote {
  const existing = getStoredQuotes();
  const index = existing.findIndex(q => q.id === quote.id);
  
  const updatedQuote: Quote = {
    ...quote,
    updatedAt: new Date().toISOString()
  };

  let updatedList: Quote[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = updatedQuote;
  } else {
    updatedList = [updatedQuote, ...existing];
  }

  saveQuotes(updatedList);
  return updatedQuote;
}

export function deleteQuote(id: string): void {
  const existing = getStoredQuotes();
  const filtered = existing.filter(q => q.id !== id);
  saveQuotes(filtered);
}

export function cloneQuote(id: string): Quote | null {
  const existing = getStoredQuotes();
  const original = existing.find(q => q.id === id);
  if (!original) return null;

  const newCode = getNextQuoteCode(original.type, existing);
  const now = new Date().toISOString();

  const cloned: Quote = {
    ...original,
    id: `quote-${Date.now()}`,
    code: newCode,
    revision: 1,
    status: 'borrador',
    title: `${original.title} (Copia)`,
    createdAt: now,
    updatedAt: now,
    sentEmailsCount: 0,
    lastSentAt: undefined,
    activityLog: [
      {
        id: `act-${Date.now()}`,
        timestamp: now,
        user: "Usuario Actual",
        action: "Cotización duplicada",
        details: `Duplicada a partir de ${original.code}`
      }
    ]
  };

  saveQuote(cloned);
  return cloned;
}

// Notifications storage
export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      saveNotifications([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading notifications:", err);
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: notifications }));
  } catch (err) {
    console.error("Error saving notifications:", err);
  }
}

export function addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
  const current = getStoredNotifications();
  const newNotif: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false
  };
  saveNotifications([newNotif, ...current]);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(updated);
}

export function markAllNotificationsAsRead(): void {
  const current = getStoredNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
}

// Export / Import Helpers
export function exportQuotesToJSON(): string {
  const quotes = getStoredQuotes();
  return JSON.stringify(quotes, null, 2);
}

export function exportQuotesToCSV(): string {
  const quotes = getStoredQuotes();
  const headers = [
    "Codigo",
    "Tipo",
    "Estado",
    "Titulo",
    "Cliente/Organismo",
    "CUIT",
    "N_Pliego_Expediente",
    "Fecha_Apertura",
    "Moneda",
    "Subtotal",
    "IVA",
    "Total",
    "Responsable",
    "Fecha_Creacion",
    "Validez_Hasta"
  ];

  const rows = quotes.map(q => [
    `"${q.code}"`,
    `"${q.type === 'licitacion' ? 'Licitación Estatal' : 'Cotización Privada'}"`,
    `"${q.status.toUpperCase()}"`,
    `"${q.title.replace(/"/g, '""')}"`,
    `"${q.clientName.replace(/"/g, '""')}"`,
    `"${q.clientCuit || ''}"`,
    `"${q.biddingDetails?.docketNumber || '-'}"`,
    `"${q.biddingDetails ? `${q.biddingDetails.openingDate} ${q.biddingDetails.openingTime}` : '-'}"`,
    `"${q.currency}"`,
    q.subtotal.toFixed(2),
    q.taxAmount.toFixed(2),
    q.total.toFixed(2),
    `"${q.assignedTo}"`,
    `"${q.createdAt.split('T')[0]}"`,
    `"${q.validUntil}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function resetSystemToZero(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    localStorage.removeItem('soluciones_integrales_quotes_v1');
    localStorage.removeItem('soluciones_integrales_notifications_v1');
    localStorage.removeItem('soluciones_integrales_team_members_v1');
    window.dispatchEvent(new CustomEvent('quotes-updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: [] }));
  } catch (err) {
    console.error("Error resetting system to zero:", err);
  }
}
