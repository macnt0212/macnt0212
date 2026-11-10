import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Download, 
  Mail, 
  Eye, 
  Plus, 
  Kanban, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileText,
  Zap,
  Users
} from 'lucide-react';
import { Quote, QuoteType } from '../types';
import { COMPANY_INFO, KANBAN_COLUMNS } from '../services/companyConfig';
import { formatCurrency, downloadQuotePDF } from '../services/pdfGenerator';
import { exportQuotesToCSV } from '../services/storage';

interface DashboardMetricsProps {
  quotes: Quote[];
  onSelectQuote: (quote: Quote) => void;
  onNewQuoteClick?: (type?: QuoteType, isQuickMode?: boolean) => void;
  onSendEmail?: (quote: Quote) => void;
  onViewChange?: (view: 'kanban' | 'list' | 'metrics') => void;
  onOpenTeamModal?: () => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ 
  quotes, 
  onSelectQuote,
  onNewQuoteClick,
  onSendEmail,
  onViewChange,
  onOpenTeamModal
}) => {
  const [filterState, setFilterState] = useState<'all' | 'licitaciones' | 'privadas' | 'urgentes'>('all');

  // Cálculos financieros
  const activeQuotes = quotes.filter(q => q.status !== 'rechazada' && q.status !== 'vencida');
  
  const totalArsActive = activeQuotes
    .filter(q => q.currency === 'ARS')
    .reduce((acc, q) => acc + q.total, 0);

  const totalUsdActive = activeQuotes
    .filter(q => q.currency === 'USD')
    .reduce((acc, q) => acc + q.total, 0);

  const wonQuotes = quotes.filter(q => q.status === 'adjudicada');
  const wonArs = wonQuotes.filter(q => q.currency === 'ARS').reduce((acc, q) => acc + q.total, 0);
  const wonUsd = wonQuotes.filter(q => q.currency === 'USD').reduce((acc, q) => acc + q.total, 0);

  const finishedQuotes = quotes.filter(q => q.status === 'adjudicada' || q.status === 'rechazada');
  const winRate = finishedQuotes.length > 0 
    ? Math.round((wonQuotes.length / finishedQuotes.length) * 100) 
    : 0;

  const licitaciones = quotes.filter(q => q.type === 'licitacion');
  const privadas = quotes.filter(q => q.type === 'privada');

  // Licitaciones con aperturas ordenadas por fecha más próxima
  const upcomingBiddings = licitaciones
    .filter(q => q.biddingDetails?.openingDate && q.status !== 'adjudicada' && q.status !== 'rechazada' && q.status !== 'vencida')
    .sort((a, b) => (a.biddingDetails?.openingDate || '').localeCompare(b.biddingDetails?.openingDate || ''));

  // Filtro práctico para la tabla rápida
  const displayedQuotes = quotes.filter(q => {
    if (filterState === 'licitaciones') return q.type === 'licitacion';
    if (filterState === 'privadas') return q.type === 'privada';
    if (filterState === 'urgentes') {
      if (q.type !== 'licitacion' || !q.biddingDetails?.openingDate) return false;
      const opening = new Date(`${q.biddingDetails.openingDate}T${q.biddingDetails.openingTime || '10:00'}:00`);
      const diffHours = (opening.getTime() - Date.now()) / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 168; // Próximos 7 días
    }
    return true;
  }).slice(0, 8);

  const handleDownloadCSV = () => {
    const csvData = exportQuotesToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Resumen_Cotizaciones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-slate-100 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-5 min-h-full">
      {/* 1. Header Ejecutivo Claro & Práctico */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Panel de Control General
            </h2>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200 font-medium">
              CUIT {COMPANY_INFO.formattedCuit}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Resumen operativo y comercial de cotizaciones privadas y licitaciones del Estado.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          {onNewQuoteClick && (
            <>
              <button
                onClick={() => onNewQuoteClick('privada', true)}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 transition shadow-2xs"
                title="Cotizar de inmediato con plantilla sin ingresar datos del cliente"
              >
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>Plantilla Rápida (Sin Cliente)</span>
              </button>

              <button
                onClick={() => onNewQuoteClick('privada')}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Nueva Privada</span>
              </button>

              <button
                onClick={() => onNewQuoteClick('licitacion')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Licitación</span>
              </button>
            </>
          )}

          {onViewChange && (
            <button
              onClick={() => onViewChange('kanban')}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition shadow-2xs"
              title="Ir al Tablero Kanban"
            >
              <Kanban className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver Kanban</span>
            </button>
          )}

          {onOpenTeamModal && (
            <button
              onClick={onOpenTeamModal}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition shadow-2xs"
              title="Gestionar responsables del equipo"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Responsables</span>
            </button>
          )}

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition shadow-2xs"
            title="Exportar base completa a CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Cuadrícula de 4 Indicadores Clave en Fondo Claro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Cartera Activa ARS */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Cartera Activa (ARS)</span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">En gestión</span>
          </div>
          <div className="my-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {formatCurrency(totalArsActive, 'ARS')}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {activeQuotes.filter(q => q.currency === 'ARS').length} presupuestos en proceso
          </div>
        </div>

        {/* KPI 2: Cartera Activa USD */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Cartera Activa (USD)</span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">En gestión</span>
          </div>
          <div className="my-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {formatCurrency(totalUsdActive, 'USD')}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {activeQuotes.filter(q => q.currency === 'USD').length} presupuestos en dólares
          </div>
        </div>

        {/* KPI 3: Licitaciones Estatales */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Licitaciones del Estado</span>
            <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
              {licitaciones.length} total
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {licitaciones.filter(l => l.status === 'presentada' || l.status === 'evaluacion').length}
            </span>
            <span className="text-xs text-slate-500">presentadas / en apertura</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {upcomingBiddings.length} aperturas programadas
          </div>
        </div>

        {/* KPI 4: Tasa de Éxito / Ganadas */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Adjudicadas (Ganadas)</span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Efectividad {winRate}%
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {wonQuotes.length}
            </span>
            <span className="text-xs text-slate-500">de {quotes.length} emitidas</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {wonArs > 0 && <span>{formatCurrency(wonArs, 'ARS')}</span>}
            {wonArs > 0 && wonUsd > 0 && <span> | </span>}
            {wonUsd > 0 && <span>{formatCurrency(wonUsd, 'USD')}</span>}
          </div>
        </div>
      </div>

      {/* 3. Sección Práctica: Aperturas de Licitaciones Inminentes */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Próximas Aperturas de Sobres & Pliegos del Estado
            </h3>
          </div>
          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
            {upcomingBiddings.length} licitaciones agendadas
          </span>
        </div>

        {upcomingBiddings.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No hay aperturas de licitación programadas en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingBiddings.map((quote) => {
              const bd = quote.biddingDetails!;
              const opening = new Date(`${bd.openingDate}T${bd.openingTime || '10:00'}:00`);
              const diffHours = (opening.getTime() - Date.now()) / (1000 * 60 * 60);
              const isUrgent = diffHours > 0 && diffHours <= 72;
              const daysLeft = Math.ceil(diffHours / 24);

              return (
                <div
                  key={quote.id}
                  className="bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-lg p-3.5 flex flex-col justify-between transition text-xs space-y-2.5 shadow-2xs hover:bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-slate-800">
                        {quote.code}
                      </span>
                      {isUrgent ? (
                        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-semibold animate-pulse">
                          Abre en {daysLeft <= 1 ? 'menos de 24 hs' : `${daysLeft} días`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                          En {daysLeft} días
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-slate-900 truncate" title={quote.title}>
                      {quote.title}
                    </p>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p className="truncate font-medium text-slate-800">{bd.agencyName}</p>
                      <p className="font-mono text-slate-500 truncate">Pliego: {bd.docketNumber}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fecha y Hora</span>
                      <span className="font-medium text-slate-700">
                        {bd.openingDate} • {bd.openingTime} hs
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onSelectQuote(quote)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition border border-transparent hover:border-slate-200"
                        title="Ver detalle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => downloadQuotePDF(quote)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition border border-transparent hover:border-slate-200"
                        title="Descargar PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {onSendEmail && (
                        <button
                          onClick={() => onSendEmail(quote)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition border border-transparent hover:border-slate-200"
                          title="Enviar por correo"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Resumen del Flujo de Trabajo (Pipeline en Fondo Claro) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Distribución por Etapas del Flujo
          </h3>
          {onViewChange && (
            <button
              onClick={() => onViewChange('kanban')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
            >
              <span>Ver tablero completo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Barra de progreso segmentada sobria */}
        <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden flex border border-slate-200">
          {KANBAN_COLUMNS.map((col, idx) => {
            const count = quotes.filter(q => q.status === col.id).length;
            const pct = quotes.length > 0 ? (count / quotes.length) * 100 : 0;
            if (pct === 0) return null;

            // Tonos sobrios en escala de grises/azules
            const bgClass = 
              col.id === 'adjudicada' ? 'bg-emerald-600' :
              col.id === 'rechazada' ? 'bg-slate-400' :
              col.id === 'vencida' ? 'bg-slate-300' :
              'bg-blue-600';

            return (
              <div 
                key={col.id} 
                style={{ width: `${pct}%` }} 
                className={`${bgClass} transition-all border-r border-white last:border-r-0`}
                title={`${col.title}: ${count} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Etiquetas sobrias del pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1 text-xs">
          {KANBAN_COLUMNS.map((col) => {
            const count = quotes.filter(q => q.status === col.id).length;
            const total = quotes.filter(q => q.status === col.id).reduce((s, q) => s + q.total, 0);

            return (
              <div key={col.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block truncate font-medium">{col.title}</span>
                <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5">{count}</span>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  {formatCurrency(total, 'ARS')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Tabla Rápida de Operaciones Recientes en Fondo Claro */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Operaciones Recientes en Gestión
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Acceso rápido para ver, descargar o gestionar presupuestos sin salir del panel.
            </p>
          </div>

          {/* Filtros rápidos sobrios en fondo claro */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterState('all')}
              className={`px-2.5 py-1 rounded transition text-xs ${
                filterState === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({quotes.length})
            </button>
            <button
              onClick={() => setFilterState('licitaciones')}
              className={`px-2.5 py-1 rounded transition text-xs ${
                filterState === 'licitaciones' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Licitaciones ({licitaciones.length})
            </button>
            <button
              onClick={() => setFilterState('privadas')}
              className={`px-2.5 py-1 rounded transition text-xs ${
                filterState === 'privadas' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Privadas ({privadas.length})
            </button>
            <button
              onClick={() => setFilterState('urgentes')}
              className={`px-2.5 py-1 rounded transition text-xs ${
                filterState === 'urgentes' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Próximas 7 días ({upcomingBiddings.length})
            </button>
          </div>
        </div>

        {/* Tabla compacta clara */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-32">Código</th>
                <th className="py-2.5 px-3 w-28">Tipo</th>
                <th className="py-2.5 px-3">Objeto / Cliente</th>
                <th className="py-2.5 px-3 w-32">Apertura / Pliego</th>
                <th className="py-2.5 px-3 w-32 text-right">Monto Total</th>
                <th className="py-2.5 px-3 w-28 text-center">Estado</th>
                <th className="py-2.5 px-4 w-28 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 px-4">
                    <div className="max-w-md mx-auto text-center space-y-2">
                      <p className="font-bold text-slate-800 text-sm">
                        Sistema en Cero y Listo para Cargar
                      </p>
                      <p className="text-xs text-slate-500">
                        No hay cotizaciones registradas en este momento. Utilice los botones superiores para emitir su primer presupuesto comercial o licitación oficial.
                      </p>
                      {onNewQuoteClick && (
                        <div className="pt-2 flex items-center justify-center gap-2">
                          <button
                            onClick={() => onNewQuoteClick('privada', true)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
                          >
                            + Plantilla Rápida
                          </button>
                          <button
                            onClick={() => onNewQuoteClick('privada')}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
                          >
                            + Cotización Privada
                          </button>
                          <button
                            onClick={() => onNewQuoteClick('licitacion')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                          >
                            + Licitación del Estado
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : displayedQuotes.map((quote) => {
                  const isLicitacion = quote.type === 'licitacion';
                  const colInfo = KANBAN_COLUMNS.find(c => c.id === quote.status) || KANBAN_COLUMNS[0];

                return (
                  <tr key={quote.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => onSelectQuote(quote)}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 transition"
                      >
                        {quote.code}
                      </button>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(quote.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {isLicitacion ? 'Licitación' : 'Privada'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <p 
                        onClick={() => onSelectQuote(quote)}
                        className="font-medium text-slate-900 line-clamp-1 hover:text-blue-600 cursor-pointer"
                      >
                        {quote.title}
                      </p>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {quote.clientName}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-[11px]">
                      {isLicitacion && quote.biddingDetails ? (
                        <div>
                          <span className="font-mono text-slate-800 truncate block font-medium">
                            {quote.biddingDetails.docketNumber}
                          </span>
                          <span className="text-slate-500 text-[10px] block">
                            {quote.biddingDetails.openingDate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(quote.total, quote.currency)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {colInfo.title}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500">
                        <button
                          onClick={() => onSelectQuote(quote)}
                          className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded transition"
                          title="Ver detalle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => downloadQuotePDF(quote)}
                          className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded transition"
                          title="Descargar PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {onSendEmail && (
                          <button
                            onClick={() => onSendEmail(quote)}
                            className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded transition"
                            title="Enviar por correo"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pie de tabla */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 px-4">
          <span>Mostrando {displayedQuotes.length} de {quotes.length} presupuestos</span>
          {onViewChange && (
            <button
              onClick={() => onViewChange('list')}
              className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline"
            >
              Ver historial completo en tabla →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
