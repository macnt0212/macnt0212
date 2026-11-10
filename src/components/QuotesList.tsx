import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Download, 
  Mail, 
  Copy, 
  Edit3, 
  Trash2, 
  Eye, 
  Filter, 
  ArrowUpDown, 
  FileSpreadsheet,
  Search,
  ExternalLink
} from 'lucide-react';
import { Quote, QuoteStatus, QuoteType } from '../types';
import { COMPANY_INFO, KANBAN_COLUMNS } from '../services/companyConfig';
import { formatCurrency, downloadQuotePDF } from '../services/pdfGenerator';
import { exportQuotesToCSV, getStoredTeamMembers } from '../services/storage';

interface QuotesListProps {
  quotes: Quote[];
  onSelectQuote: (quote: Quote) => void;
  onEditQuote: (quote: Quote) => void;
  onDuplicateQuote: (quoteId: string) => void;
  onDeleteQuote: (quoteId: string) => void;
  onSendEmail: (quote: Quote) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewQuoteClick: (type?: QuoteType) => void;
}

export const QuotesList: React.FC<QuotesListProps> = ({
  quotes,
  onSelectQuote,
  onEditQuote,
  onDuplicateQuote,
  onDeleteQuote,
  onSendEmail,
  searchQuery,
  onSearchChange,
  onNewQuoteClick
}) => {
  const [filterType, setFilterType] = useState<'all' | QuoteType>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'code' | 'opening'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const storedMembers = getStoredTeamMembers();

  // Filter
  const filtered = quotes.filter(q => {
    if (filterType !== 'all' && q.type !== filterType) return false;
    if (filterStatus !== 'all' && q.status !== filterStatus) return false;
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

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'total') {
      comparison = b.total - a.total;
    } else if (sortBy === 'code') {
      comparison = a.code.localeCompare(b.code);
    } else if (sortBy === 'opening') {
      const aDate = a.biddingDetails?.openingDate || '9999-99-99';
      const bDate = b.biddingDetails?.openingDate || '9999-99-99';
      comparison = aDate.localeCompare(bDate);
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  const handleDownloadCSV = () => {
    const csvData = exportQuotesToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Historial_Cotizaciones_Soluciones_Integrales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-hidden">
      {/* Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en el historial por código, cliente o pliego..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todos los Tipos</option>
            <option value="licitacion">Licitaciones Estatales</option>
            <option value="privada">Cotizaciones Privadas</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todos los Estados</option>
            {KANBAN_COLUMNS.map(col => (
              <option key={col.id} value={col.id}>{col.title}</option>
            ))}
          </select>

          {/* Sorting */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value="date">Ordenar por Fecha</option>
              <option value="total">Ordenar por Monto</option>
              <option value="code">Ordenar por Código</option>
              <option value="opening">Fecha de Apertura</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded"
              title="Cambiar orden"
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Export & New */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Tabular Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-lg">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4 w-32">Código</th>
                <th className="py-3 px-3 w-40">Tipo</th>
                <th className="py-3 px-4">Objeto / Título</th>
                <th className="py-3 px-4">Cliente / Organismo</th>
                <th className="py-3 px-3 w-36">Pliego / Apertura</th>
                <th className="py-3 px-3 w-32 text-right">Monto Total</th>
                <th className="py-3 px-3 w-32 text-center">Estado</th>
                <th className="py-3 px-4 w-40 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No se encontraron cotizaciones con los filtros actuales.
                  </td>
                </tr>
              ) : (
                sorted.map((quote) => {
                  const isLicitacion = quote.type === 'licitacion';
                const assigned = storedMembers.find(m => m.id === quote.assignedTo);
                const colInfo = KANBAN_COLUMNS.find(c => c.id === quote.status) || KANBAN_COLUMNS[0];

                return (
                  <tr key={quote.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectQuote(quote)}
                          className="font-mono font-bold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {quote.code}
                        </button>
                        <span className="text-[10px] text-slate-500">v{quote.revision}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(quote.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isLicitacion 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {isLicitacion ? <Calendar className="w-3 h-3 text-indigo-400" /> : <Building2 className="w-3 h-3 text-emerald-400" />}
                        <span>{isLicitacion ? 'Licitación' : 'Privada'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p 
                        onClick={() => onSelectQuote(quote)}
                        className="font-semibold text-white line-clamp-1 hover:text-blue-400 cursor-pointer"
                      >
                        {quote.title}
                      </p>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {quote.items.length} ítems • Resp: {assigned?.name || 'Dirección Comercial'}
                      </span>
                    </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-200 line-clamp-1">{quote.clientName}</p>
                        <span className="text-[10px] font-mono text-slate-500">{quote.clientCuit || 'Sin CUIT'}</span>
                      </td>

                      <td className="py-3 px-3">
                        {isLicitacion && quote.biddingDetails ? (
                          <div className="text-[11px] space-y-0.5">
                            <span className="font-mono text-indigo-300 block truncate" title={quote.biddingDetails.docketNumber}>
                              {quote.biddingDetails.docketNumber}
                            </span>
                            {quote.biddingDetails.openingDate && (
                              <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                                <Clock className="w-2.5 h-2.5" />
                                {quote.biddingDetails.openingDate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-white text-xs block">
                          {formatCurrency(quote.total, quote.currency)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          IVA: {formatCurrency(quote.taxAmount, quote.currency)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          quote.status === 'adjudicada' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          quote.status === 'rechazada' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          quote.status === 'vencida' ? 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colInfo.dot}`}></span>
                          <span>{colInfo.title}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => downloadQuotePDF(quote)}
                            className="p-1.5 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                            title="Descargar PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSendEmail(quote)}
                            className="p-1.5 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                            title="Enviar por Correo"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicateQuote(quote.id)}
                            className="p-1.5 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                            title="Duplicar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onEditQuote(quote)}
                            className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`¿Está seguro de eliminar ${quote.code}?`)) {
                                onDeleteQuote(quote.id);
                              }
                            }}
                            className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400">
          <span>Mostrando {sorted.length} de {quotes.length} presupuestos en la base de datos</span>
          <span>{COMPANY_INFO.name} • CUIT {COMPANY_INFO.formattedCuit}</span>
        </div>
      </div>
    </div>
  );
};
