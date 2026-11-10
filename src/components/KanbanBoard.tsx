import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  MoreVertical, 
  Mail, 
  Download, 
  Eye, 
  User, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Quote, QuoteStatus, QuoteType, TeamMember } from '../types';
import { KANBAN_COLUMNS } from '../services/companyConfig';
import { formatCurrency, downloadQuotePDF } from '../services/pdfGenerator';
import { saveQuote, addNotification, getStoredTeamMembers } from '../services/storage';

interface KanbanBoardProps {
  quotes: Quote[];
  onSelectQuote: (quote: Quote) => void;
  onEditQuote: (quote: Quote) => void;
  onSendEmail: (quote: Quote) => void;
  onUpdateQuote: (quote: Quote) => void;
  searchQuery: string;
  onOpenTeamModal?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  quotes,
  onSelectQuote,
  onEditQuote,
  onSendEmail,
  onUpdateQuote,
  searchQuery,
  onOpenTeamModal
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(getStoredTeamMembers());
  const [filterType, setFilterType] = useState<'all' | QuoteType>('all');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [draggedQuoteId, setDraggedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => setTeamMembers(getStoredTeamMembers());
    window.addEventListener('team-members-updated', handleUpdate);
    return () => window.removeEventListener('team-members-updated', handleUpdate);
  }, []);

  // Filter quotes by search and active filters
  const filteredQuotes = quotes.filter(q => {
    // Type filter
    if (filterType !== 'all' && q.type !== filterType) return false;
    // Member filter
    if (filterMember !== 'all' && q.assignedTo !== filterMember) return false;
    // Search query
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      const matchCode = q.code.toLowerCase().includes(qLower);
      const matchTitle = q.title.toLowerCase().includes(qLower);
      const matchClient = q.clientName.toLowerCase().includes(qLower);
      const matchDocket = q.biddingDetails?.docketNumber?.toLowerCase().includes(qLower);
      if (!matchCode && !matchTitle && !matchClient && !matchDocket) return false;
    }
    return true;
  });

  const handleStatusChange = (quote: Quote, newStatus: QuoteStatus) => {
    if (quote.status === newStatus) return;

    // Trigger celebration if winning a quote/bidding
    if (newStatus === 'adjudicada') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    const assigned = teamMembers.find(m => m.id === quote.assignedTo);
    const updated: Quote = {
      ...quote,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: assigned?.name || "Operador",
          action: `Estado cambiado a '${newStatus.toUpperCase()}'`,
          details: `Movido en el tablero Kanban a la columna ${newStatus}`
        },
        ...quote.activityLog
      ]
    };

    onUpdateQuote(updated);

    // Create notification
    addNotification({
      quoteId: quote.id,
      quoteCode: quote.code,
      type: 'status_change',
      title: `Cambio de Estado: ${quote.code}`,
      message: `El presupuesto para '${quote.clientName}' pasó a estado '${newStatus}'.`,
      priority: newStatus === 'adjudicada' ? 'info' : 'warning'
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, quoteId: string) => {
    e.dataTransfer.setData('text/plain', quoteId);
    setDraggedQuoteId(quoteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: QuoteStatus) => {
    e.preventDefault();
    const quoteId = e.dataTransfer.getData('text/plain');
    if (!quoteId) return;

    const quote = quotes.find(q => q.id === quoteId);
    if (quote && quote.status !== targetStatus) {
      handleStatusChange(quote, targetStatus);
    }
    setDraggedQuoteId(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Kanban Filters and Quick Controls */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Filtrar por:</span>
          </span>

          {/* Type Filter Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded transition text-xs ${filterType === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Todos ({quotes.length})
            </button>
            <button
              onClick={() => setFilterType('licitacion')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition text-xs ${filterType === 'licitacion' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              <Calendar className="w-3 h-3 text-slate-300" />
              <span>Licitaciones ({quotes.filter(q => q.type === 'licitacion').length})</span>
            </button>
            <button
              onClick={() => setFilterType('privada')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition text-xs ${filterType === 'privada' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              <Building2 className="w-3 h-3 text-slate-300" />
              <span>Privadas ({quotes.filter(q => q.type === 'privada').length})</span>
            </button>
          </div>

          {/* Responsable Filter & Add Button */}
          <div className="flex items-center gap-1.5 ml-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos los Responsables</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {onOpenTeamModal && (
              <button
                onClick={onOpenTeamModal}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700 transition font-medium"
                title="Agregar o gestionar responsables"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Responsable</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Pipeline Amount Preview */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="text-slate-400">
            Mostrando <span className="text-white font-bold">{filteredQuotes.length}</span> presupuestos
          </div>
        </div>
      </div>

      {/* Kanban Columns Horizontal Scrolling Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-x-auto overflow-y-hidden flex gap-4 min-w-full">
        {KANBAN_COLUMNS.map((column) => {
          const colQuotes = filteredQuotes.filter(q => q.status === column.id);
          const colTotalArs = colQuotes
            .filter(q => q.currency === 'ARS')
            .reduce((sum, q) => sum + q.total, 0);
          const colTotalUsd = colQuotes
            .filter(q => q.currency === 'USD')
            .reduce((sum, q) => sum + q.total, 0);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id as QuoteStatus)}
              className="w-80 sm:w-84 shrink-0 flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 shadow-lg shadow-black/20 overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`}></span>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      {column.title}
                    </h3>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                    {colQuotes.length}
                  </span>
                </div>

                {/* Subtotals in column */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="text-slate-500">Monto total:</span>
                  <div className="text-right font-medium text-slate-300">
                    {colTotalArs > 0 && <span>{formatCurrency(colTotalArs, 'ARS')}</span>}
                    {colTotalArs > 0 && colTotalUsd > 0 && <span className="mx-1 text-slate-600">|</span>}
                    {colTotalUsd > 0 && <span className="text-emerald-400">{formatCurrency(colTotalUsd, 'USD')}</span>}
                    {colTotalArs === 0 && colTotalUsd === 0 && <span className="text-slate-600">{formatCurrency(0, 'ARS')}</span>}
                  </div>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2.5 overflow-y-auto space-y-3 min-h-[150px]">
                {colQuotes.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-xs text-slate-600">
                    Arrastra cotizaciones aquí
                  </div>
                ) : (
                  colQuotes.map((quote) => {
                    const isLicitacion = quote.type === 'licitacion';
                    const assigned = teamMembers.find(m => m.id === quote.assignedTo);
                    
                    // Check opening urgency
                    let isUrgentOpening = false;
                    let openingInfo = '';
                    if (isLicitacion && quote.biddingDetails?.openingDate) {
                      const openingDate = new Date(`${quote.biddingDetails.openingDate}T${quote.biddingDetails.openingTime || '10:00'}:00`);
                      const diffHours = (openingDate.getTime() - Date.now()) / (1000 * 60 * 60);
                      isUrgentOpening = diffHours > 0 && diffHours <= 72 && quote.status !== 'adjudicada' && quote.status !== 'rechazada';
                      openingInfo = `${quote.biddingDetails.openingDate} ${quote.biddingDetails.openingTime || ''}`;
                    }

                    return (
                      <div
                        key={quote.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, quote.id)}
                        className={`group bg-slate-850 hover:bg-slate-800 border rounded-xl p-3 shadow-md transition-all cursor-grab active:cursor-grabbing relative ${
                          draggedQuoteId === quote.id ? 'opacity-40 scale-95' : 'opacity-100'
                        } ${
                          isUrgentOpening 
                            ? 'border-rose-500/70 shadow-rose-950/20 ring-1 ring-rose-500/30' 
                            : 'border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        {/* Type & Urgent Ribbon */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isLicitacion 
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {isLicitacion ? (
                              <>
                                <Calendar className="w-3 h-3 text-indigo-400" />
                                <span>LICITACIÓN ESTATAL</span>
                              </>
                            ) : (
                              <>
                                <Building2 className="w-3 h-3 text-emerald-400" />
                                <span>COTIZACIÓN PRIVADA</span>
                              </>
                            )}
                          </span>

                          <span className="font-mono text-xs font-bold text-blue-400">
                            {quote.code}
                          </span>
                        </div>

                        {/* Title & Customer */}
                        <h4 
                          onClick={() => onSelectQuote(quote)}
                          className="font-semibold text-xs text-white leading-snug line-clamp-2 hover:text-blue-400 cursor-pointer transition"
                        >
                          {quote.title}
                        </h4>

                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                          {quote.clientName}
                        </p>

                        {/* State tender specific box if licitación */}
                        {isLicitacion && quote.biddingDetails && (
                          <div className="mt-2 p-2 bg-slate-900/90 rounded-lg border border-indigo-900/40 text-[10px] space-y-1">
                            <div className="flex items-center justify-between gap-1 text-slate-300 truncate">
                              <span className="text-slate-500">Pliego:</span>
                              <span className="font-mono text-indigo-300 truncate">
                                {quote.biddingDetails.docketNumber}
                              </span>
                            </div>

                            {quote.biddingDetails.openingDate && (
                              <div className={`flex items-center justify-between gap-1 pt-0.5 border-t border-slate-800 ${
                                isUrgentOpening ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Apertura:</span>
                                </span>
                                <span>{openingInfo} hs</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Amount & Items Count */}
                        <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total c/IVA</span>
                            <span className="text-sm font-extrabold text-white tracking-tight">
                              {formatCurrency(quote.total, quote.currency)}
                            </span>
                          </div>

                          {/* Assigned Team Member Avatar */}
                          <div className="flex items-center gap-1.5" title={`Responsable: ${assigned?.name || 'Sin asignar'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${assigned?.avatarColor || 'bg-slate-700'}`}>
                              {assigned ? assigned.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'SI'}
                            </div>
                          </div>
                        </div>

                        {/* Quick Action Footer */}
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-xs">
                          {/* Fast Move Buttons */}
                          <div className="flex items-center gap-1">
                            {/* Prev stage */}
                            {column.id !== 'borrador' && (
                              <button
                                onClick={() => {
                                  const idx = KANBAN_COLUMNS.findIndex(c => c.id === column.id);
                                  if (idx > 0) handleStatusChange(quote, KANBAN_COLUMNS[idx - 1].id as QuoteStatus);
                                }}
                                title="Mover a etapa anterior"
                                className="p-1 hover:text-white hover:bg-slate-700 rounded transition"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Next stage */}
                            {column.id !== 'vencida' && column.id !== 'rechazada' && column.id !== 'adjudicada' && (
                              <button
                                onClick={() => {
                                  const idx = KANBAN_COLUMNS.findIndex(c => c.id === column.id);
                                  if (idx >= 0 && idx < KANBAN_COLUMNS.length - 1) {
                                    handleStatusChange(quote, KANBAN_COLUMNS[idx + 1].id as QuoteStatus);
                                  }
                                }}
                                title="Avanzar de etapa"
                                className="p-1 hover:text-white hover:bg-slate-700 rounded transition"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* PDF & Email Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => downloadQuotePDF(quote)}
                              title="Descargar PDF Oficial"
                              className="p-1 hover:text-blue-400 hover:bg-slate-700 rounded transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onSendEmail(quote)}
                              title="Enviar por Correo al Cliente y Equipo"
                              className="p-1 hover:text-emerald-400 hover:bg-slate-700 rounded transition relative"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              {quote.sentEmailsCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                              )}
                            </button>

                            <button
                              onClick={() => onSelectQuote(quote)}
                              title="Ver detalle completo"
                              className="p-1 hover:text-white hover:bg-slate-700 rounded transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
