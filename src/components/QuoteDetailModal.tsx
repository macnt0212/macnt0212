import React from 'react';
import { 
  X, 
  Download, 
  Mail, 
  Copy, 
  Edit3, 
  Printer, 
  Building2, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  History,
  ShieldCheck,
  User,
  ArrowRight
} from 'lucide-react';
import { Quote, QuoteStatus } from '../types';
import { COMPANY_INFO, COMPANY_LOGO_URL, COMPANY_SIGNATURE_FALLBACK, KANBAN_COLUMNS } from '../services/companyConfig';
import { getStoredTeamMembers } from '../services/storage';
import { formatCurrency, formatQuantity, downloadQuotePDF, printQuotePDF } from '../services/pdfGenerator';

interface QuoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  onEdit: (quote: Quote) => void;
  onDuplicate: (quoteId: string) => void;
  onSendEmail: (quote: Quote) => void;
  onStatusChange: (quote: Quote, status: QuoteStatus) => void;
}

export const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  isOpen,
  onClose,
  quote,
  onEdit,
  onDuplicate,
  onSendEmail,
  onStatusChange
}) => {
  if (!isOpen || !quote) return null;

  const isLicitacion = quote.type === 'licitacion';
  const members = getStoredTeamMembers();
  const assigned = members.find(m => m.id === quote.assignedTo) || members[0] || COMPANY_SIGNATURE_FALLBACK;
  const colInfo = KANBAN_COLUMNS.find(c => c.id === quote.status) || KANBAN_COLUMNS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Action Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 bg-slate-950 rounded-lg p-0.5 border border-cyan-500/30 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src={COMPANY_LOGO_URL} 
                alt={COMPANY_INFO.name} 
                className="h-full w-auto object-contain max-w-[150px] rounded" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-white">
                  {quote.code}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-700">
                  Rev. {quote.revision}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                  quote.status === 'adjudicada' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  quote.status === 'rechazada' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {colInfo.title}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isLicitacion ? 'Licitación Oficial para el Estado' : 'Cotización Comercial Privada'} • Emitida el {new Date(quote.createdAt).toLocaleDateString('es-AR')}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadQuotePDF(quote)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
              title="Descargar PDF Oficial"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={() => printQuotePDF(quote)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Imprimir Presupuesto Oficial"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={() => onSendEmail(quote)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Enviar por Correo Electrónico"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enviar Email</span>
            </button>

            <button
              onClick={() => onDuplicate(quote.id)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Duplicar cotización"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Duplicar</span>
            </button>

            <button
              onClick={() => onEdit(quote)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Editar cotización"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Editar</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {/* Status Progression Bar */}
          <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                Flujo de Trabajo del Presupuesto
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Cambiar estado a:</span>
                <select
                  value={quote.status}
                  onChange={(e) => onStatusChange(quote, e.target.value as QuoteStatus)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  {KANBAN_COLUMNS.map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stepper Dots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2 border-t border-slate-800/80">
              {KANBAN_COLUMNS.map((step) => {
                const isCurrent = quote.status === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => onStatusChange(quote, step.id as QuoteStatus)}
                    className={`p-2 rounded-lg text-left transition border ${
                      isCurrent 
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${step.dot}`}></span>
                      <span className="text-[11px] truncate">{step.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special State Bidding Details Banner */}
          {isLicitacion && quote.biddingDetails && (
            <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900 p-4 sm:p-5 rounded-xl border border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Calendar className="w-4 h-4" />
                  <span className="uppercase tracking-wider">Detalle Oficial del Pliego de Licitación</span>
                </div>
                <span className="text-[11px] bg-indigo-900/60 text-indigo-200 font-semibold px-2 py-0.5 rounded border border-indigo-700/50">
                  {quote.biddingDetails.biddingType}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-indigo-900/40">
                <div>
                  <span className="text-slate-400 block text-[11px]">Organismo Convocante:</span>
                  <span className="font-semibold text-white text-xs">{quote.biddingDetails.agencyName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">N° de Pliego / Expediente:</span>
                  <span className="font-mono font-bold text-indigo-300 text-xs">{quote.biddingDetails.docketNumber}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Fecha y Hora de Apertura:</span>
                  <span className="font-semibold text-rose-300 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {quote.biddingDetails.openingDate} a las {quote.biddingDetails.openingTime} hs
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Lugar / Portal de Apertura:</span>
                  <span className="text-slate-200 text-xs">{quote.biddingDetails.openingPlace}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Garantía de Oferta Requerida:</span>
                  <span className="text-slate-200 text-xs font-medium">
                    {quote.biddingDetails.guaranteePercentage}% ({formatCurrency(quote.biddingDetails.guaranteeAmount || 0, quote.currency)})
                  </span>
                </div>

                {quote.biddingDetails.clarificationDeadline && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Límite de Consultas:</span>
                    <span className="text-slate-200 text-xs">{quote.biddingDetails.clarificationDeadline}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title and Client Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">
                Objeto de la Cotización
              </span>
              <p className="text-sm font-bold text-white leading-snug">
                {quote.title}
              </p>
              {quote.notes && (
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-800 italic">
                  "{quote.notes}"
                </p>
              )}
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">
                Destinatario / Comitente
              </span>
              <p className="text-sm font-bold text-white">
                {quote.clientName}
              </p>
              <div className="text-slate-400 space-y-0.5 text-xs">
                <p>CUIT: <span className="font-mono text-slate-200">{quote.clientCuit || 'Sin CUIT registrado'}</span></p>
                <p>Contacto: <span className="text-slate-200">{quote.clientContactPerson || '-'}</span></p>
                <p>Email: <span className="text-slate-200">{quote.clientEmail || '-'}</span></p>
                <p>Dirección: <span className="text-slate-200">{quote.clientAddress || '-'}</span></p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Planilla de Cómputo y Precios
              </span>
              <span className="text-slate-400 text-[11px]">
                {quote.items.length} ítems cotizados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-2 w-24">Código</th>
                    <th className="py-2.5 px-3">Descripción</th>
                    <th className="py-2.5 px-2 w-16 text-center">Unid.</th>
                    <th className="py-2.5 px-2 w-16 text-right">Cant.</th>
                    <th className="py-2.5 px-3 w-28 text-right">P. Unitario</th>
                    <th className="py-2.5 px-2 w-20 text-center">IVA %</th>
                    <th className="py-2.5 px-3 w-32 text-right">Subtotal Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {quote.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-2 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2 px-2 font-mono text-slate-400">{item.code || '-'}</td>
                      <td className="py-2 px-3 text-slate-200">
                        <div>{item.description}</div>
                        {typeof item.cost === 'number' && item.cost > 0 && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                            <span className="text-amber-300/80">Costo: {formatCurrency(item.cost, quote.currency)}</span>
                            <span className="text-emerald-400 font-semibold">Rentabilidad: +{item.profitMargin ?? 20}%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-400">{item.unit}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-200">{formatQuantity(item.quantity)}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-200 whitespace-nowrap">{formatCurrency(item.unitPrice, quote.currency)}</td>
                      <td className="py-2 px-2 text-center font-mono text-slate-400">{item.taxRate}%</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-white whitespace-nowrap">{formatCurrency(item.subtotal, quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-slate-400 text-xs space-y-1">
                <p>• Validez de la Oferta: <span className="text-white font-medium">{quote.validUntil}</span></p>
                <p>• Plazo de Entrega: <span className="text-white font-medium">{quote.deliveryTerms || 'Los equipos se entregan a partir del primer pago.'}</span></p>
                <p>• Forma de Pago: <span className="text-white font-medium">{quote.paymentTerms || 'Contra entrega y el resto a 30 días.'}</span></p>
                <p>• CBU Pagos: <span className="font-mono text-cyan-300 font-medium">{quote.cbu || COMPANY_INFO.bankDetails.cbu}</span> ({quote.bank || COMPANY_INFO.bankDetails.bank}){quote.alias || COMPANY_INFO.bankDetails.alias ? ` • Alias: ${quote.alias || COMPANY_INFO.bankDetails.alias}` : ''}</p>
              </div>

              <div className="w-full sm:w-84 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                {quote.totalCost !== undefined && quote.totalCost > 0 && (
                  <div className="pb-2 mb-2 border-b border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-slate-300 text-xs">
                      <span className="font-semibold text-amber-300">Costo Mercadería (Empresa):</span>
                      <span className="font-mono text-amber-200 font-extrabold">{formatCurrency(quote.totalCost, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-semibold text-xs">
                      <span>Margen de Ganancia ({(quote.profitPercentage ?? 20).toFixed(1)}%):</span>
                      <span className="font-mono text-emerald-300 font-bold">+{formatCurrency(quote.totalProfit ?? (quote.subtotal - quote.totalCost), quote.currency)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>Subtotal Neto:</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(quote.subtotal, quote.currency)}</span>
                </div>
                {quote.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-400 font-medium">
                    <span>Descuento ({quote.discountPercentage}%):</span>
                    <span className="font-mono font-bold">-{formatCurrency(quote.discountAmount, quote.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>I.V.A. (21%):</span>
                  <span className="font-mono text-sky-300 font-bold">{formatCurrency(quote.taxAmount, quote.currency)}</span>
                </div>
                <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center font-extrabold text-white text-sm bg-blue-950/40 p-2 rounded-lg border border-blue-900/50">
                  <span className="text-xs uppercase tracking-wider text-blue-200">TOTAL DEL MONTO A PAGAR:</span>
                  <span className="font-mono text-base text-blue-300 font-black">{formatCurrency(quote.total, quote.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Team Member & Activity History Log */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Responsible Member */}
            <div className="md:col-span-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">
                Responsable del Equipo
              </span>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white ${assigned.avatarColor}`}>
                  {assigned.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="font-bold text-white text-xs">{assigned.name}</p>
                  <p className="text-[11px] text-slate-400">{assigned.role}</p>
                  <p className="text-[10px] text-blue-400">{assigned.email}</p>
                </div>
              </div>
            </div>

            {/* Activity History Audit Trail */}
            <div className="md:col-span-8 bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-400" />
                <span>Historial de Actividad & Auditoría</span>
              </span>

              <div className="space-y-2 max-h-36 overflow-y-auto divide-y divide-slate-800/60">
                {quote.activityLog.map((log) => (
                  <div key={log.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">{log.action}</span>
                      <span className="text-slate-500 mx-1.5">•</span>
                      <span className="text-slate-400">{log.user}</span>
                      {log.details && <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>}
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('es-AR')} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Soluciones Integrales • CUIT {COMPANY_INFO.formattedCuit}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
