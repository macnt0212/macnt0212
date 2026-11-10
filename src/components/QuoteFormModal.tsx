import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Building2, 
  Calendar, 
  Clock, 
  DollarSign, 
  Save, 
  FileText, 
  CheckCircle, 
  HelpCircle, 
  AlertCircle, 
  User, 
  Percent, 
  Sparkles,
  Zap,
  Check,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Calculator,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Quote, QuoteItem, QuoteType, QuoteStatus, QuoteTemplate, TeamMember } from '../types';
import { COMPANY_INFO, COMPANY_SIGNATURE_FALLBACK, BUDGET_TEMPLATES } from '../services/companyConfig';
import { calculateTotals, getNextQuoteCode, getStoredQuotes, getStoredTeamMembers, getStoredBankDetails, saveStoredBankDetails } from '../services/storage';
import { formatCurrency } from '../services/pdfGenerator';
import { CurrencyInput } from './CurrencyInput';

// Porcentajes fijos predeterminados del sistema de presupuestación
export const FIXED_PROFIT_MARGINS = [
  { value: 20, label: '20% · Estándar de la Empresa (Predeterminado)', shortLabel: '+20% Estándar', isDefault: true },
  { value: 30, label: '30% · Equipamiento / Alta Complejidad', shortLabel: '+30% Equipamiento' },
  { value: 15, label: '15% · Volumen / Mayorista', shortLabel: '+15% Volumen' },
  { value: 10, label: '10% · Mínimo Competitivo (Licitaciones)', shortLabel: '+10% Mínimo' },
  { value: 25, label: '25% · Intermedio Comercial', shortLabel: '+25%' },
  { value: 35, label: '35% · Instalaciones Especiales', shortLabel: '+35%' },
  { value: 40, label: '40% · Servicios / Guardias de Urgencia', shortLabel: '+40%' },
  { value: 50, label: '50% · Desarrollo a Medida / Alta Rentabilidad', shortLabel: '+50%' },
  { value: 0, label: '0% · Al Costo de Mercadería (Sin Margen)', shortLabel: '0% Al Costo' },
];

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quote: Quote) => void;
  initialQuote?: Quote | null;
  defaultType?: QuoteType;
  initialQuickMode?: boolean;
  onOpenTeamModal?: () => void;
}

export const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuote,
  defaultType = 'privada',
  initialQuickMode = false,
  onOpenTeamModal
}) => {
  if (!isOpen) return null;

  const isEditing = !!initialQuote;
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Form State
  const [type, setType] = useState<QuoteType>(initialQuote?.type || defaultType);
  const [code, setCode] = useState<string>(initialQuote?.code || '');
  const [title, setTitle] = useState(initialQuote?.title || '');
  const [status, setStatus] = useState<QuoteStatus>(initialQuote?.status || 'borrador');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(initialQuote?.currency || 'ARS');
  const [exchangeRate, setExchangeRate] = useState<number>(initialQuote?.exchangeRate || 1250);
  
  // Quick Quote / Plantilla sin datos de cliente
  const [isQuickQuote, setIsQuickQuote] = useState<boolean>(
    initialQuickMode || initialQuote?.isQuickQuote || false
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showAdvancedClientFields, setShowAdvancedClientFields] = useState<boolean>(false);

  // Client
  const [clientName, setClientName] = useState(initialQuote?.clientName || '');
  const [clientCuit, setClientCuit] = useState(initialQuote?.clientCuit || '');
  const [clientContactPerson, setClientContactPerson] = useState(initialQuote?.clientContactPerson || '');
  const [clientEmail, setClientEmail] = useState(initialQuote?.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(initialQuote?.clientPhone || '');
  const [clientAddress, setClientAddress] = useState(initialQuote?.clientAddress || '');

  // Licitación State
  const [agencyName, setAgencyName] = useState(initialQuote?.biddingDetails?.agencyName || '');
  const [docketNumber, setDocketNumber] = useState(initialQuote?.biddingDetails?.docketNumber || '');
  const [biddingType, setBiddingType] = useState<'Licitación Pública' | 'Licitación Privada' | 'Contratación Directa' | 'Concurso de Precios'>(
    initialQuote?.biddingDetails?.biddingType || 'Licitación Pública'
  );
  const [openingDate, setOpeningDate] = useState(initialQuote?.biddingDetails?.openingDate || '');
  const [openingTime, setOpeningTime] = useState(initialQuote?.biddingDetails?.openingTime || '11:00');
  const [openingPlace, setOpeningPlace] = useState(initialQuote?.biddingDetails?.openingPlace || 'Plataforma Oficial COMPR.AR / Mesa de Entradas');
  const [guaranteePercentage, setGuaranteePercentage] = useState<number>(initialQuote?.biddingDetails?.guaranteePercentage || 1);
  const [clarificationDeadline, setClarificationDeadline] = useState(initialQuote?.biddingDetails?.clarificationDeadline || '');

  // Team & Priority
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(getStoredTeamMembers());
  const [assignedTo, setAssignedTo] = useState(initialQuote?.assignedTo || '');
  const [priority, setPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>(initialQuote?.priority || 'media');

  useEffect(() => {
    const updateMembers = () => {
      setTeamMembers(getStoredTeamMembers());
    };
    updateMembers();
    window.addEventListener('team-members-updated', updateMembers);
    return () => window.removeEventListener('team-members-updated', updateMembers);
  }, []);
  
  // Commercial
  const [validUntil, setValidUntil] = useState(
    initialQuote?.validUntil || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialQuote?.paymentTerms || 'Contra entrega y el resto a 30 días.'
  );
  const [deliveryTerms, setDeliveryTerms] = useState(
    initialQuote?.deliveryTerms || 'Los equipos se entregan a partir del primer pago.'
  );
  const [warrantyTerms, setWarrantyTerms] = useState(initialQuote?.warrantyTerms || '12 meses de garantía integral sobre provisión y mano de obra.');
  const [discountPercentage, setDiscountPercentage] = useState<number>(initialQuote?.discountPercentage || 0);
  const [notes, setNotes] = useState(initialQuote?.notes || '');

  // Datos Bancarios Configurables (Banco, CBU/CVU, Alias)
  const initialBank = getStoredBankDetails();
  const [bank, setBank] = useState<string>(
    initialQuote?.bank || initialBank.bank || COMPANY_INFO.bankDetails.bank
  );
  const [cbu, setCbu] = useState<string>(
    initialQuote?.cbu || initialBank.cbu || COMPANY_INFO.bankDetails.cbu
  );
  const [alias, setAlias] = useState<string>(
    initialQuote?.alias || initialBank.alias || COMPANY_INFO.bankDetails.alias
  );

  // Items y Calculadora de Rentabilidad
  const [globalSelectedMargin, setGlobalSelectedMargin] = useState<string>('20');
  const [customGlobalMargin, setCustomGlobalMargin] = useState<number>(20);
  const [items, setItems] = useState<QuoteItem[]>(
    initialQuote?.items || [
      {
        id: `item-${Date.now()}-1`,
        code: 'PROV-001',
        description: 'Provisión e instalación integral de equipamiento y materiales',
        unit: 'u',
        quantity: 1,
        cost: 1000000,
        profitMargin: 20,
        unitPrice: 1200000,
        taxRate: 21,
        subtotal: 1200000
      }
    ]
  );

  // Auto-generate code when type changes on creation
  useEffect(() => {
    if (!isEditing) {
      const allQuotes = getStoredQuotes();
      const generatedCode = getNextQuoteCode(type, allQuotes);
      setCode(generatedCode);
    }
  }, [type, isEditing]);

  // Si se abre en modo rápido (sin cliente), preconfigurar automáticamente
  useEffect(() => {
    if (initialQuickMode && !isEditing) {
      setIsQuickQuote(true);
      if (!clientName) {
        setClientName('Consumidor Final / Cliente a Designar');
        setClientCuit('Consumidor Final');
        setClientContactPerson('Área de Compras / A designar');
        setClientEmail('ventas@solucionesintegrales.com.ar');
        setClientAddress('A coordinar según entrega');
      }
      if (!title) {
        setTitle('Presupuesto Estimativo de Suministro y Servicios');
      }
    }
  }, [initialQuickMode, isEditing]);

  // Aplicar plantilla completa con 1 clic (costos + margen 20%/30% + 21% IVA)
  const handleApplyTemplate = (tpl: QuoteTemplate) => {
    setSelectedTemplateId(tpl.id);
    setTitle(tpl.defaultTitle);
    setPaymentTerms(tpl.paymentTerms);
    setDeliveryTerms(tpl.deliveryTerms);
    setWarrantyTerms(tpl.warrantyTerms);
    setCurrency(tpl.currency);
    setIsQuickQuote(true);
    setClientName('Consumidor Final / Cliente a Designar');
    setClientCuit('Consumidor Final');
    setClientContactPerson('Área de Compras / A designar');
    setClientEmail('ventas@solucionesintegrales.com.ar');
    setClientAddress('A convenir según entrega');
    setItems(tpl.items.map((it, idx) => {
      const qty = Number(it.quantity) || 1;
      const cost = typeof it.cost === 'number' && it.cost > 0
        ? it.cost 
        : (it.unitPrice ? Math.round(it.unitPrice / 1.20) : 0);
      const profitMargin = typeof it.profitMargin === 'number' ? it.profitMargin : 20;
      const unitPrice = it.unitPrice || Math.round(cost * (1 + profitMargin / 100));
      return {
        id: `item-${Date.now()}-${idx + 1}`,
        code: it.code || `ITEM-${String(idx + 1).padStart(2, '0')}`,
        description: it.description,
        unit: it.unit,
        quantity: qty,
        cost,
        profitMargin,
        unitPrice,
        taxRate: typeof it.taxRate === 'number' ? it.taxRate : 21,
        subtotal: qty * unitPrice
      };
    }));
  };

  // Recalculate totals con rentabilidad e IVA 21%
  const totals = calculateTotals(items, discountPercentage);

  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      code: `ITEM-${String(items.length + 1).padStart(2, '0')}`,
      description: '',
      unit: 'u',
      quantity: 1,
      cost: 0,
      profitMargin: typeof customGlobalMargin === 'number' ? customGlobalMargin : 20, // Margen actual configurado
      unitPrice: 0,
      taxRate: 21, // 21% de IVA por defecto
      subtotal: 0
    };
    setItems([...items, newItem]);
  };

  // Borrar ítem de la lista (permite borrar sin trabas)
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      // Si borra el único ítem que quedaba, lo resetea en blanco para cargar de nuevo
      setItems([{
        id: `item-${Date.now()}-1`,
        code: 'ITEM-01',
        description: '',
        unit: 'u',
        quantity: 1,
        cost: 0,
        profitMargin: typeof customGlobalMargin === 'number' ? customGlobalMargin : 20,
        unitPrice: 0,
        taxRate: 21,
        subtotal: 0
      }]);
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  // Vaciar todos los ítems de una vez
  const handleClearAllItems = () => {
    if (items.length > 0 && window.confirm("¿Desea vaciar todos los ítems de la lista para comenzar a cargar desde cero?")) {
      setItems([{
        id: `item-${Date.now()}-1`,
        code: 'ITEM-01',
        description: '',
        unit: 'u',
        quantity: 1,
        cost: 0,
        profitMargin: typeof customGlobalMargin === 'number' ? customGlobalMargin : 20,
        unitPrice: 0,
        taxRate: 21,
        subtotal: 0
      }]);
    }
  };

  // Cambio de campo individual con recalculo automático Costo + Margen
  const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };

        // Si se cambia el costo base o el % de rentabilidad
        if (field === 'cost' || field === 'profitMargin') {
          const c = Number(updated.cost) || 0;
          const m = typeof updated.profitMargin === 'number' && !isNaN(updated.profitMargin) ? updated.profitMargin : 0;
          if (c > 0) {
            updated.unitPrice = Math.round(c * (1 + m / 100));
          }
        }

        // Si se cambia manualmente el precio unitario final de venta
        if (field === 'unitPrice') {
          const uPrice = Number(updated.unitPrice) || 0;
          const c = Number(updated.cost) || 0;
          if (c > 0) {
            updated.profitMargin = Number((((uPrice - c) / c) * 100).toFixed(1));
          } else if (uPrice > 0) {
            // Asume base de 20% de rentabilidad
            updated.cost = Math.round(uPrice / 1.20);
            updated.profitMargin = 20;
          }
        }

        const qty = Number(updated.quantity) || 0;
        const uPrice = Number(updated.unitPrice) || 0;
        updated.subtotal = qty * uPrice;

        return updated;
      }
      return item;
    }));
  };

  // Botón rápido para fijar rentabilidad (+20%, +30% o libre) en una fila
  const handleSetItemMargin = (id: string, margin: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const cost = Number(item.cost) || (item.unitPrice ? Math.round(item.unitPrice / 1.20) : 0);
        const newUnitPrice = Math.round(cost * (1 + margin / 100));
        const qty = Number(item.quantity) || 1;
        return {
          ...item,
          cost,
          profitMargin: margin,
          unitPrice: newUnitPrice,
          subtotal: qty * newUnitPrice
        };
      }
      return item;
    }));
  };

  // Aplicar rentabilidad global (+20%, +30% u otro %) a todos los ítems cargados
  const handleApplyGlobalMargin = (margin: number) => {
    setItems(items.map(item => {
      const currentCost = Number(item.cost) || (item.unitPrice ? Math.round(item.unitPrice / (1 + (item.profitMargin || 20) / 100)) : 0);
      const newUnitPrice = Math.round(currentCost * (1 + margin / 100));
      const qty = Number(item.quantity) || 1;
      return {
        ...item,
        cost: currentCost,
        profitMargin: margin,
        unitPrice: newUnitPrice,
        subtotal: qty * newUnitPrice
      };
    }));
  };

  const handleAddPreset = (presetType: 'mano_obra' | 'equipamiento' | 'mantenimiento') => {
    let preset: Partial<QuoteItem> = {};
    if (presetType === 'mano_obra') {
      preset = {
        code: 'MO-ESP-01',
        description: 'Mano de obra técnica especializada con seguro de ART y elementos de protección personal',
        unit: 'global',
        quantity: 1,
        cost: 708333,
        profitMargin: 20,
        unitPrice: 850000,
        taxRate: 21,
        subtotal: 850000
      };
    } else if (presetType === 'equipamiento') {
      preset = {
        code: 'EQ-IND-02',
        description: 'Suministro de componentes certificados bajo normas IRAM e ISO 9001',
        unit: 'u',
        quantity: 5,
        cost: 246154,
        profitMargin: 30,
        unitPrice: 320000,
        taxRate: 21,
        subtotal: 1600000
      };
    } else {
      preset = {
        code: 'SERV-ABON-03',
        description: 'Servicio de mantenimiento preventivo mensual y guardias de emergencia',
        unit: 'mes',
        quantity: 6,
        cost: 346154,
        profitMargin: 30,
        unitPrice: 450000,
        taxRate: 21,
        subtotal: 2700000
      };
    }

    setItems([...items, {
      id: `item-${Date.now()}-${items.length + 1}`,
      code: preset.code || 'ITEM',
      description: preset.description || '',
      unit: preset.unit || 'u',
      quantity: preset.quantity || 1,
      cost: preset.cost || 0,
      profitMargin: preset.profitMargin ?? 20,
      unitPrice: preset.unitPrice || 0,
      taxRate: preset.taxRate || 21,
      subtotal: preset.subtotal || 0
    }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Por favor ingrese el objeto o título de la cotización.");
      return;
    }

    // Si es modo rápido, resolver cliente por defecto sin bloquear
    const finalClientName = isQuickQuote 
      ? (clientName.trim() || 'Consumidor Final / Cliente a Designar')
      : clientName.trim();

    if (!isQuickQuote && !finalClientName) {
      alert(type === 'licitacion' ? "Por favor ingrese el organismo convocante." : "Por favor ingrese el nombre del cliente.");
      return;
    }

    if (type === 'licitacion' && !docketNumber.trim()) {
      alert("Por favor ingrese el N° de Pliego o Expediente de la licitación.");
      return;
    }

    const assigned = teamMembers.find(m => m.id === assignedTo) || COMPANY_SIGNATURE_FALLBACK;
    const now = new Date().toISOString();

    const quoteToSave: Quote = {
      id: initialQuote?.id || `quote-${Date.now()}`,
      code: code || (type === 'licitacion' ? 'LIC-2026-0000' : 'COT-2026-0000'),
      revision: initialQuote ? initialQuote.revision + 1 : 1,
      type,
      status,
      title: title.trim(),
      createdAt: initialQuote?.createdAt || now,
      updatedAt: now,
      validUntil,
      isQuickQuote,

      clientName: finalClientName,
      clientCuit: isQuickQuote && !clientCuit.trim() ? 'Consumidor Final' : clientCuit.trim(),
      clientContactPerson: clientContactPerson.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),

      biddingDetails: type === 'licitacion' ? {
        agencyName: agencyName.trim() || clientName.trim(),
        docketNumber: docketNumber.trim(),
        biddingType,
        openingDate,
        openingTime,
        openingPlace: openingPlace.trim(),
        guaranteePercentage,
        guaranteeAmount: totals.total * (guaranteePercentage / 100),
        clarificationDeadline
      } : undefined,

      currency,
      exchangeRate: currency === 'USD' ? exchangeRate : undefined,
      items,

      totalCost: totals.totalCost,
      totalProfit: totals.totalProfit,
      profitPercentage: totals.profitPercentage,
      subtotal: totals.subtotal,
      discountPercentage,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      taxBreakdown: totals.taxBreakdown,
      total: totals.total,

      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      bank: bank.trim() || COMPANY_INFO.bankDetails.bank,
      cbu: cbu.trim() || COMPANY_INFO.bankDetails.cbu,
      alias: alias.trim() || COMPANY_INFO.bankDetails.alias,
      notes,

      assignedTo,
      priority,
      tags: [
        type === 'licitacion' ? 'Licitación Estatal' : 'Privada',
        biddingType || 'Comercial'
      ],
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: now,
          user: assigned?.name || "Operador",
          action: isEditing ? `Cotización actualizada (Rev. ${(initialQuote?.revision || 1) + 1})` : "Cotización oficial creada",
          details: isEditing ? "Modificación de ítems o condiciones del presupuesto" : `Apertura del legajo con numeración ${code}`
        },
        ...(initialQuote?.activityLog || [])
      ],

      sentEmailsCount: initialQuote?.sentEmailsCount || 0,
      lastSentAt: initialQuote?.lastSentAt
    };

    // Guardar datos bancarios preferidos para próximas cotizaciones
    saveStoredBankDetails({
      bank: bank.trim() || COMPANY_INFO.bankDetails.bank,
      cbu: cbu.trim() || COMPANY_INFO.bankDetails.cbu,
      alias: alias.trim() || COMPANY_INFO.bankDetails.alias
    });

    onSave(quoteToSave);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isMaximized ? 'p-0 bg-black/90' : 'p-2 sm:p-4 bg-black/75 backdrop-blur-sm'} overflow-hidden animate-in fade-in duration-150`}>
      <div className={`bg-slate-900 border border-slate-800 ${isMaximized ? 'w-screen h-screen max-w-none max-h-none rounded-none' : 'w-full max-w-7xl lg:w-[96vw] rounded-2xl shadow-2xl max-h-[96vh]'} overflow-hidden flex flex-col my-auto transition-all duration-200`}>
        {/* Modal Header */}
        <div className="p-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 sm:p-2.5 rounded-xl border ${
              type === 'licitacion' 
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' 
                : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {type === 'licitacion' ? <Calendar className="w-5 h-5 sm:w-6 sm:h-6" /> : <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {isEditing ? `Modificar ${code}` : `Nuevo Presupuesto / Cotización`}
                </h2>
                <span className="font-mono text-xs font-extrabold bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700/50">
                  {code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {COMPANY_INFO.name} • CUIT {COMPANY_INFO.formattedCuit}
              </p>
            </div>
          </div>

          {/* Right Header: Live Monto Total + Maximize + Close */}
          <div className="flex items-center gap-2.5">
            {/* Live Total Amount Badge in Header */}
            <div className="bg-slate-950/90 px-3.5 py-1.5 rounded-xl border border-blue-900/60 shadow-xs flex items-center gap-3">
              <div className="text-right">
                <span className="text-[9px] text-blue-300 font-bold block uppercase tracking-wider">
                  Monto Total a Pagar (c/IVA 21%)
                </span>
                <span className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
                  {formatCurrency(totals.total, currency)}
                </span>
              </div>
            </div>

            {/* Maximize / Restore Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-xs bg-slate-850 border border-slate-700 shadow-xs"
              title={isMaximized ? "Restaurar ventana" : "Maximizar ventana (Pantalla Completa para ver todo)"}
            >
              {isMaximized ? (
                <>
                  <Minimize2 className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline font-semibold">Restaurar</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline font-semibold">Maximizar</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Form with Sticky Bottom Bar */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Type Switcher */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Tipo de Presupuesto
              </label>
              <p className="text-xs text-slate-400">
                Seleccione si es una cotización comercial ordinaria o una licitación con pliego para el Estado.
              </p>
            </div>

            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setType('privada')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
                  type === 'privada'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Cotización Privada</span>
              </button>

              <button
                type="button"
                onClick={() => setType('licitacion')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
                  type === 'licitacion'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Licitación para el Estado</span>
              </button>
            </div>
          </div>

          {/* Plantillas de Presupuesto Rápido (Sin Datos de Cliente) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-900/40 text-blue-400 border border-blue-800/60">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Plantillas Rápidas Preconfiguradas</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-normal lowercase">
                      sin cargar cliente
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Carga ítems, precios y plazos con 1 clic para presupuestar sin ingresar datos fiscales del cliente.
                  </p>
                </div>
              </div>

              {isQuickQuote && (
                <span className="text-[10px] bg-blue-950 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-800 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Modo Sin Cliente Activo</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              {BUDGET_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-slate-800 border-blue-500 shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-white line-clamp-1">{tpl.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/80">
                      <span>{tpl.items.length} ítems cargados</span>
                      <span className="text-blue-400 font-medium font-mono">
                        {formatCurrency(tpl.items.reduce((s, it) => s + (it.quantity * it.unitPrice), 0), tpl.currency || 'ARS')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Specific State Bidding Fields (Only if Licitación) */}
          {type === 'licitacion' && (
            <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 pb-2 border-b border-indigo-900/40">
                <Calendar className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Datos del Pliego de Licitación & Acto de Apertura
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Organismo Convocante <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ministerio de Salud / AFIP / Municipalidad"
                    value={agencyName}
                    onChange={(e) => {
                      setAgencyName(e.target.value);
                      if (!clientName) setClientName(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    N° de Pliego / Expediente <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. PLIEG-2026-442199-APN / Expte EX-2026"
                    value={docketNumber}
                    onChange={(e) => setDocketNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Modalidad de Contratación
                  </label>
                  <select
                    value={biddingType}
                    onChange={(e) => setBiddingType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Licitación Pública">Licitación Pública Nacional</option>
                    <option value="Licitación Privada">Licitación Privada Estatal</option>
                    <option value="Contratación Directa">Contratación Directa</option>
                    <option value="Concurso de Precios">Concurso de Precios</option>
                  </select>
                </div>

                {/* Apertura: Fecha y Hora */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Fecha de Apertura de Sobres <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Hora de Apertura
                  </label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Garantía de Oferta (% del total)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={guaranteePercentage}
                      onChange={(e) => setGuaranteePercentage(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Lugar de Apertura o Portal Oficial
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Sala de Licitaciones PB / Portal COMPR.AR"
                    value={openingPlace}
                    onChange={(e) => setOpeningPlace(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Fecha Límite para Consultas
                  </label>
                  <input
                    type="date"
                    value={clarificationDeadline}
                    onChange={(e) => setClarificationDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. General Information */}
          <div className="bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Datos Principales & Cliente
                </h3>
                <p className="text-[11px] text-slate-400">
                  Objeto del presupuesto y destinatario de la oferta.
                </p>
              </div>

              {/* Checkbox para activar/desactivar presupuesto sin datos de cliente */}
              <label className="flex items-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-750 transition">
                <input
                  type="checkbox"
                  checked={isQuickQuote}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsQuickQuote(checked);
                    if (checked) {
                      if (!clientName || clientName === 'Telecom Argentina S.A.') {
                        setClientName('Consumidor Final / Cliente a Designar');
                      }
                      setClientCuit('Consumidor Final');
                      if (!title) setTitle('Presupuesto Estimativo de Suministro y Servicios');
                    }
                  }}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-950"
                />
                <span className="text-xs font-semibold text-slate-200">
                  Presupuestar sin datos de cliente (Consumidor Final)
                </span>
              </label>
            </div>

            {isQuickQuote ? (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-md bg-blue-900/40 text-blue-400 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-200">
                        Modo Rápido Activado: No se requieren datos fiscales del cliente
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        El documento oficial y el PDF se emitirán automáticamente para <strong className="text-slate-300">"Consumidor Final / Cliente a Designar"</strong>. Puedes cargar directamente los ítems y precios abajo.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedClientFields(!showAdvancedClientFields)}
                    className="text-[11px] text-slate-400 hover:text-white underline whitespace-nowrap shrink-0"
                  >
                    {showAdvancedClientFields ? 'Ocultar campos opcionales' : 'Ingresar datos opcionales'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">
                      Objeto de la Cotización / Título de la Oferta <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Presupuesto Estimativo de Suministro e Instalación"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Referencia o Rótulo de Fantasía (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Consumidor Final / Cliente a Designar"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Contacto o Destino de Entrega (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="A coordinar según requerimiento"
                      value={clientContactPerson}
                      onChange={(e) => setClientContactPerson(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {showAdvancedClientFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-800 animate-in fade-in">
                    <div>
                      <label className="block text-slate-400 mb-1">CUIT / Identificación Fiscal</label>
                      <input
                        type="text"
                        placeholder="Consumidor Final"
                        value={clientCuit}
                        onChange={(e) => setClientCuit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        placeholder="ventas@solucionesintegrales.com.ar"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Dirección / Localidad</label>
                      <input
                        type="text"
                        placeholder="A convenir"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-slate-300 font-medium mb-1">
                    Objeto de la Cotización / Título de la Oferta <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Provisión e Instalación de Cableado Estructurado y Fibra Óptica"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {type === 'licitacion' ? 'Comitente / Ente' : 'Razón Social / Cliente'} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Telecom Argentina S.A."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    CUIT / Identificación Fiscal
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 30-71234567-8"
                    value={clientCuit}
                    onChange={(e) => setClientCuit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Lic. Carlos Méndez"
                    value={clientContactPerson}
                    onChange={(e) => setClientContactPerson(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@empresa.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="+54 11 4455-6677"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Dirección / Destino
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Paseo Colón 850, CABA"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Settings: Currency, Team Member, Status */}
          <div className="bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Moneda de Cotización
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ARS">ARS ($ - Pesos Argentinos)</option>
                <option value="USD">USD (Dólares Estadounidenses)</option>
              </select>
            </div>

            {currency === 'USD' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tipo de Cambio de Referencia (ARS)
                </label>
                <CurrencyInput
                  value={exchangeRate}
                  onChange={(val) => setExchangeRate(val)}
                  currency="ARS"
                  placeholder="1.250,00"
                  accentColor="blue"
                  className="px-1 py-0.5"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-medium">
                  Responsable Asignado
                </label>
                {onOpenTeamModal && (
                  <button
                    type="button"
                    onClick={onOpenTeamModal}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Responsable</span>
                  </button>
                )}
              </div>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Sin asignar / Dirección Comercial --</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
              {teamMembers.length === 0 && (
                <div className="mt-1.5 flex items-center justify-between text-[11px] bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                  <span className="text-slate-400">No hay responsables cargados</span>
                  {onOpenTeamModal && (
                    <button
                      type="button"
                      onClick={onOpenTeamModal}
                      className="text-blue-400 hover:text-blue-300 font-medium underline"
                    >
                      + Crear nuevo
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Estado Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
              >
                <option value="borrador">Borrador</option>
                <option value="revision">En Revisión Interna</option>
                <option value="presentada">Presentada / Enviada</option>
                <option value="evaluacion">En Evaluación / Apertura</option>
                <option value="adjudicada">Adjudicada (Ganada)</option>
                <option value="rechazada">No Adjudicada</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* 5. Items Table */}
          <div className="bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Detalle de Ítems, Cantidades & Precios
                </h3>
                <p className="text-[11px] text-slate-400">
                  Desglose oficial con cálculo automático de alícuotas de IVA y subtotales.
                </p>
              </div>

              {/* Quick Preset Buttons & Global Profitability Controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Plantillas rápidas:</span>
                <button
                  type="button"
                  onClick={() => handleAddPreset('mano_obra')}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 transition"
                  title="Carga mano de obra técnica con +20% de margen y 21% IVA"
                >
                  + Mano de Obra (+20%)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset('equipamiento')}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 transition"
                  title="Carga equipamiento con +30% de margen y 21% IVA"
                >
                  + Equipamiento (+30%)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset('mantenimiento')}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 transition"
                  title="Carga abono con +30% de margen y 21% IVA"
                >
                  + Abono Mensual (+30%)
                </button>
              </div>
            </div>

            {/* Global Profit Margin & IVA Fast Tool */}
            <div className="bg-slate-950/90 p-3 sm:p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              {/* Left: Dropdown con márgenes fijos del sistema + botones rápidos */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Rentabilidad Global:</span>
                </div>

                {/* Dropdown de porcentajes fijos del sistema */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={globalSelectedMargin}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGlobalSelectedMargin(val);
                      if (val !== 'custom') {
                        const num = Number(val);
                        setCustomGlobalMargin(num);
                        handleApplyGlobalMargin(num);
                      }
                    }}
                    className="bg-slate-900 border border-slate-700 hover:border-emerald-500 text-emerald-300 font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
                    title="Seleccione un margen fijo preconfigurado en el sistema"
                  >
                    <optgroup label="Márgenes Fijos del Sistema">
                      {FIXED_PROFIT_MARGINS.map(m => (
                        <option key={m.value} value={String(m.value)}>
                          {m.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Carga Libre Encargado">
                      <option value="custom">✏️ Cargar otro % manualmente (Encargado)...</option>
                    </optgroup>
                  </select>
                </div>

                {/* Botones directos rápidos para 15%, 20% y 30% */}
                <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Rápidos:</span>
                  {[15, 20, 30].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setGlobalSelectedMargin(String(pct));
                        setCustomGlobalMargin(pct);
                        handleApplyGlobalMargin(pct);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition shadow-xs cursor-pointer ${
                        Number(customGlobalMargin) === pct && globalSelectedMargin === String(pct)
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
                      }`}
                      title={`Fijar +${pct}% a todos los ítems`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Entrada manual de margen cargado por el encargado */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner">
                  <span className="text-[11px] text-amber-300 font-semibold">Carga manual encargado:</span>
                  <div className="flex items-center bg-slate-950 px-1.5 py-0.5 rounded border border-slate-600 focus-within:border-emerald-500">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.5"
                      value={customGlobalMargin}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setCustomGlobalMargin(val);
                        const matches = FIXED_PROFIT_MARGINS.find(m => m.value === val);
                        setGlobalSelectedMargin(matches ? String(matches.value) : 'custom');
                      }}
                      className="w-14 bg-transparent text-right font-mono text-xs text-white font-bold focus:outline-none"
                      placeholder="%"
                      title="Margen manual libre cargado por el encargado"
                    />
                    <span className="text-slate-400 font-mono text-xs ml-1">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyGlobalMargin(customGlobalMargin);
                    }}
                    className="ml-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                    title="Aplica este margen manual a todos los renglones"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aplicar a Todos</span>
                  </button>
                </div>
                <span className="text-[11px] bg-slate-900 text-sky-300 font-bold px-2.5 py-1.5 rounded-xl border border-sky-800/60 shadow-xs hidden xl:inline-block">
                  IVA 21% Estándar
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner bg-slate-950/40">
              <table className="w-full text-left text-xs min-w-[1020px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/80">
                    <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                    <th className="py-2.5 px-2 w-24">Código</th>
                    <th className="py-2.5 px-2 min-w-[200px]">Descripción del Ítem / Mercadería</th>
                    <th className="py-2.5 px-2 w-20 text-center">Unidad</th>
                    <th className="py-2.5 px-2 w-16 text-right">Cant.</th>
                    <th className="py-2.5 px-2 w-36 text-right">
                      <span className="block text-amber-300 font-bold">Costo Mercadería</span>
                      <span className="text-[9px] text-slate-400 font-normal">($ unit. empresa)</span>
                    </th>
                    <th className="py-2.5 px-2 w-56 text-center">
                      <span className="block text-emerald-400 font-bold">Margen de Rentabilidad</span>
                      <span className="text-[9px] text-slate-400 font-normal">Menú fijo sistema / Carga manual</span>
                    </th>
                    <th className="py-2.5 px-2 w-36 text-right">
                      <span className="block text-slate-200 font-bold">P. Unit. Neto</span>
                      <span className="text-[9px] text-slate-400 font-normal">Costo + Margen</span>
                    </th>
                    <th className="py-2.5 px-2 w-20 text-center">
                      <span className="block text-slate-300 font-bold">IVA</span>
                      <span className="text-[9px] text-sky-400 font-normal">21%</span>
                    </th>
                    <th className="py-2.5 px-3 w-36 text-right">
                      <span className="block text-white font-bold">Subtotal Neto</span>
                      <span className="text-[9px] text-slate-400 font-normal">Cant. × P. Unit.</span>
                    </th>
                    <th className="py-2.5 px-2 w-14 text-center">
                      <span className="text-[10px] text-rose-400 font-bold">Borrar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((item, index) => {
                    const currentCost = Number(item.cost) || 0;
                    const currentMargin = typeof item.profitMargin === 'number' ? item.profitMargin : 20;
                    const currentQty = Number(item.quantity) || 1;
                    const totalLineCost = currentCost * currentQty;
                    const unitProfit = Math.max(0, (item.unitPrice || 0) - currentCost);
                    const isFixedMargin = FIXED_PROFIT_MARGINS.some(m => Math.abs(m.value - currentMargin) < 0.01);

                    return (
                      <tr key={item.id} className="hover:bg-slate-900/60 transition group bg-slate-900/20">
                        {/* Num */}
                        <td className="py-2.5 px-2.5 text-center text-slate-500 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Código */}
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={item.code || ''}
                            onChange={(e) => handleItemChange(item.id, 'code', e.target.value)}
                            placeholder={`ITEM-${String(index + 1).padStart(2, '0')}`}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Descripción */}
                        <td className="py-2.5 px-2">
                          <textarea
                            rows={2}
                            required
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            placeholder="Descripción técnica del material o servicio..."
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                        </td>

                        {/* Unidad */}
                        <td className="py-2.5 px-2">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="u">u (unid)</option>
                            <option value="global">global</option>
                            <option value="mes">mes</option>
                            <option value="hs">hs (horas)</option>
                            <option value="m">m (metros)</option>
                            <option value="m²">m²</option>
                            <option value="kg">kg</option>
                          </select>
                        </td>

                        {/* Cantidad */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-right text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-medium"
                          />
                        </td>

                        {/* Costo Mercadería Empresa (Costo Unitario + Costo Total Línea) */}
                        <td className="py-2.5 px-2">
                          <CurrencyInput
                            value={item.cost}
                            onChange={(val) => handleItemChange(item.id, 'cost', val)}
                            currency={currency}
                            accentColor="amber"
                            placeholder="0,00"
                            title="Ingrese el costo de compra o adquisición unitaria que le sale a la empresa (formato automático con miles . y decimales ,)"
                          />
                          <div className="mt-1 space-y-0.5 text-right font-mono">
                            {totalLineCost > 0 && currentQty > 1 && (
                              <span className="text-[9px] text-amber-300/80 block truncate bg-amber-950/40 px-1 py-0.2 rounded border border-amber-900/40">
                                Total Costo: {formatCurrency(totalLineCost, currency)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Margen de Rentabilidad: Menú Desplegable con Porcentajes Fijos del Sistema + Carga Manual por Encargado */}
                        <td className="py-2.5 px-2">
                          <div className="space-y-1.5 min-w-[200px]">
                            {/* 1. Menú Desplegable con Porcentajes Fijos del Sistema */}
                            <select
                              value={isFixedMargin ? String(Math.round(currentMargin)) : 'custom'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'custom') {
                                  handleItemChange(item.id, 'profitMargin', item.profitMargin ?? 20);
                                } else {
                                  handleSetItemMargin(item.id, Number(val));
                                }
                              }}
                              className="w-full bg-slate-900 border border-slate-700 hover:border-emerald-500 text-emerald-400 font-bold rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
                              title="Seleccione un margen fijo del sistema o elija carga manual"
                            >
                              <optgroup label="Porcentajes Fijos del Sistema">
                                {FIXED_PROFIT_MARGINS.map(m => (
                                  <option key={m.value} value={String(m.value)}>
                                    +{m.value}% — {m.shortLabel}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Carga Libre Encargado">
                                <option value="custom">
                                  {isFixedMargin ? '✏️ Cargar otro % manualmente...' : `✏️ Carga manual (${currentMargin}%)`}
                                </option>
                              </optgroup>
                            </select>

                            {/* 2. Campo de Entrada Manual y Botones Rápidos para el Encargado */}
                            <div className="flex items-center gap-1.5">
                              {/* Entrada manual directa */}
                              <div className="flex-1 flex items-center bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-700 hover:border-emerald-500/70 focus-within:border-emerald-500 transition shadow-xs">
                                <span className="text-[10px] text-slate-400 mr-1 font-medium select-none">Manual:</span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  max="1000"
                                  value={item.profitMargin ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                    handleItemChange(item.id, 'profitMargin', val);
                                  }}
                                  className="w-full bg-transparent text-right text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                                  placeholder="%"
                                  title="El encargado de presupuestos puede ingresar manualmente cualquier margen aquí"
                                />
                                <span className="text-[10px] text-slate-400 font-mono font-bold ml-1">%</span>
                              </div>

                              {/* Botones directos rápidos: 15% | 20% | 30% */}
                              <div className="flex items-center gap-0.5">
                                {[15, 20, 30].map(pct => {
                                  const isActive = Math.round(currentMargin) === pct && isFixedMargin;
                                  return (
                                    <button
                                      key={pct}
                                      type="button"
                                      onClick={() => handleSetItemMargin(item.id, pct)}
                                      className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded transition cursor-pointer border ${
                                        isActive
                                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
                                      }`}
                                      title={`Fijar +${pct}% de margen fijo`}
                                    >
                                      {pct}%
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 3. Indicador de Ganancia Neta Unitaria en Pesos */}
                            {unitProfit > 0 && (
                              <div className="flex items-center justify-between text-[10px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                                <span className="text-emerald-400/90 font-medium">Ganancia unit.:</span>
                                <span className="text-emerald-300 font-mono font-bold">
                                  +{formatCurrency(unitProfit, currency)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Precio Unitario Neto de Venta */}
                        <td className="py-2.5 px-2">
                          <CurrencyInput
                            value={item.unitPrice}
                            onChange={(val) => handleItemChange(item.id, 'unitPrice', val)}
                            currency={currency}
                            accentColor="blue"
                            placeholder="0,00"
                            title="Precio de venta unitario neto (formato automático con miles . y decimales ,)"
                          />
                        </td>

                        {/* IVA % (predeterminado 21%) */}
                        <td className="py-2.5 px-2">
                          <select
                            value={item.taxRate ?? 21}
                            onChange={(e) => handleItemChange(item.id, 'taxRate', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-mono font-medium cursor-pointer"
                            title="Alícuota de IVA (predeterminado 21%)"
                          >
                            <option value="21">21 %</option>
                            <option value="10.5">10.5 %</option>
                            <option value="27">27 %</option>
                            <option value="0">0 % (Exento)</option>
                          </select>
                        </td>

                        {/* Subtotal Neto (con indicador c/IVA) */}
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-mono font-extrabold text-white text-xs block whitespace-nowrap">
                            {formatCurrency(item.subtotal, currency)}
                          </span>
                          <span className="text-[10px] text-sky-400 font-mono block whitespace-nowrap mt-0.5 font-medium">
                            c/IVA: {formatCurrency(item.subtotal * (1 + (item.taxRate ?? 21) / 100), currency)}
                          </span>
                        </td>

                        {/* Borrar Ítem (permite eliminar si está mal cargado o no se requiere) */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-600 border border-rose-800/40 hover:border-rose-500 transition shadow-xs cursor-pointer group/del"
                            title="Eliminar este ítem (borrar ítem mal cargado o no requerido)"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400 group-hover/del:text-white transition" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Item Action Buttons: Agregar Ítem + Vaciar Ítems Mal Cargados */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl border border-blue-500 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nuevo Ítem (+20% e IVA 21%)</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllItems}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-700/80 px-3.5 py-1.5 rounded-xl border border-rose-800/50 hover:border-rose-500 transition cursor-pointer"
                title="Vaciar todos los ítems para comenzar de nuevo si fueron mal cargados"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar / Limpiar Ítems Mal Cargados</span>
              </button>
            </div>
          </div>

          {/* 6. Commercial Terms & Totals Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Commercial Terms */}
            <div className="lg:col-span-7 bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider">
                Condiciones Comerciales & Plazos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Forma / Condición de Pago</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Plazo de Entrega / Ejecución</label>
                  <input
                    type="text"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Garantía Ofrecida</label>
                  <input
                    type="text"
                    value={warrantyTerms}
                    onChange={(e) => setWarrantyTerms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Validez de la Oferta Hasta</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Datos Bancarios y CBU de Cobranza (Carga Manual) */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    Datos Bancarios para Pagos (CBU y Banco)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Carga manual · Se guarda y figura en el PDF oficial
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Entidad Bancaria</label>
                    <input
                      type="text"
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      placeholder="Ej: Banco Santander Argentina"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">CBU / CVU</label>
                    <input
                      type="text"
                      value={cbu}
                      onChange={(e) => setCbu(e.target.value)}
                      placeholder="0720042720000042757904"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Alias CBU / CVU</label>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="SOLUCIONES.INTEG.SI"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observaciones / Notas Internas</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional para el equipo..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Totals Summary */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
                Resumen Económico & Fiscal
              </h3>

              <div className="space-y-2.5 text-xs">
                {/* Costo Mercadería Empresa y Rentabilidad */}
                <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-slate-300 text-xs">
                    <span className="font-semibold text-amber-300">Costo de Mercadería (Empresa):</span>
                    <span className="font-mono text-amber-200 font-extrabold text-sm">{formatCurrency(totals.totalCost, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 font-semibold text-xs pt-1 border-t border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Margen de Ganancia ({totals.profitPercentage.toFixed(1)}%):
                    </span>
                    <span className="font-mono text-emerald-300 font-extrabold text-sm">+{formatCurrency(totals.totalProfit, currency)}</span>
                  </div>
                </div>

                {/* Subtotal Neto de Venta */}
                <div className="flex justify-between text-slate-200 font-semibold px-1 pt-1">
                  <span>Subtotal Neto (Venta sin IVA):</span>
                  <span className="font-mono font-bold text-sm text-white">{formatCurrency(totals.subtotal, currency)}</span>
                </div>

                {/* Descuento cargado por el encargado con botones rápidos */}
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-medium text-slate-400">Descuento Encargado:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(Number(e.target.value) || 0)}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-xs text-rose-300 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <span className="text-slate-400 font-mono">%</span>
                      <span className="font-mono text-rose-400 font-bold ml-2">
                        -{formatCurrency(totals.discountAmount, currency)}
                      </span>
                    </div>
                  </div>
                  {/* Chips rápidos de descuento para el encargado */}
                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-[10px] text-slate-500 mr-1">Rápido:</span>
                    {[0, 5, 10, 15, 20].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDiscountPercentage(d)}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition cursor-pointer border ${
                          discountPercentage === d
                            ? 'bg-rose-900 text-rose-200 border-rose-600'
                            : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-850'
                        }`}
                      >
                        {d}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tax Breakdown (IVA 21%) */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5 px-1">
                  {Object.entries(totals.taxBreakdown).map(([rate, amount]) => (
                    <div key={rate} className="flex justify-between text-slate-300 text-xs">
                      <span>I.V.A. ({rate}%):</span>
                      <span className="font-mono font-medium text-sky-300">{formatCurrency(amount, currency)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-slate-200 font-bold text-xs pt-1 border-t border-slate-850">
                    <span>Total Impuestos I.V.A.:</span>
                    <span className="font-mono text-sky-400 font-bold text-sm">{formatCurrency(totals.taxAmount, currency)}</span>
                  </div>
                </div>

                {/* TOTAL DEL MONTO A PAGAR */}
                <div className="mt-3 pt-3 border-t-2 border-blue-600/50 bg-gradient-to-r from-blue-950/80 to-indigo-950/80 p-3.5 rounded-xl border border-blue-800 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-xs text-blue-300 font-extrabold uppercase tracking-wider block">
                      TOTAL DEL MONTO A PAGAR
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Subtotal Neto + 21% I.V.A.</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                    {formatCurrency(totals.total, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions & Live Monto Bar */}
        <div className="p-3 sm:px-6 sm:py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xl">
          {/* Live Amounts Summary Strip */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap text-xs">
            <div className="hidden lg:block">
              <span className="text-[10px] text-slate-400 block font-medium">Costo Mercadería Empresa:</span>
              <span className="font-mono text-amber-300 font-bold">{formatCurrency(totals.totalCost, currency)}</span>
            </div>
            <div className="hidden md:block">
              <span className="text-[10px] text-slate-400 block font-medium">Rentabilidad ({totals.profitPercentage.toFixed(1)}%):</span>
              <span className="font-mono text-emerald-400 font-bold">+{formatCurrency(totals.totalProfit, currency)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Subtotal Neto:</span>
              <span className="font-mono text-slate-200 font-bold">{formatCurrency(totals.subtotal, currency)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">I.V.A. (21%):</span>
              <span className="font-mono text-sky-300 font-bold">{formatCurrency(totals.taxAmount, currency)}</span>
            </div>
            <div className="bg-blue-950/90 px-3.5 py-1.5 rounded-xl border border-blue-500/50 shadow-md">
              <span className="text-[9px] text-blue-300 uppercase font-black tracking-wider block">
                MONTO TOTAL A PAGAR
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                {formatCurrency(totals.total, currency)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios' : 'Generar Cotización Oficial'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
    </div>
  );
};
