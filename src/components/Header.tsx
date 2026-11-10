import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Kanban, 
  BarChart3, 
  Plus, 
  Bell, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  ShieldCheck,
  Search,
  CheckCircle2,
  Calendar,
  Zap,
  Users,
  UserPlus,
  RotateCcw
} from 'lucide-react';
import { COMPANY_INFO, COMPANY_LOGO_URL } from '../services/companyConfig';
import { AppNotification } from '../types';
import { exportQuotesToCSV, exportQuotesToJSON, saveQuotes, getStoredQuotes, resetSystemToZero } from '../services/storage';

interface HeaderProps {
  currentView: 'kanban' | 'list' | 'metrics';
  onViewChange: (view: 'kanban' | 'list' | 'metrics') => void;
  onNewQuoteClick: (type?: 'privada' | 'licitacion', isQuickMode?: boolean) => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefreshData: () => void;
  onOpenTeamModal?: () => void;
  teamMembersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onNewQuoteClick,
  notifications,
  onOpenNotifications,
  searchQuery,
  onSearchChange,
  onRefreshData,
  onOpenTeamModal,
  teamMembersCount
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDownloadCSV = () => {
    const csvData = exportQuotesToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cotizaciones_Soluciones_Integrales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleDownloadJSON = () => {
    const jsonData = exportQuotesToJSON();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Backup_Cotizaciones_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            saveQuotes(parsed);
            onRefreshData();
            alert(`Base de datos restaurada con éxito: ${parsed.length} presupuestos importados.`);
          }
        } catch (err) {
          alert("Error al importar el archivo JSON. Formato inválido.");
        }
      };
      reader.readAsText(file);
    }
    setShowExportMenu(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-sm">
      {/* Top Banner with Company Data */}
      <div className="bg-slate-950 px-4 sm:px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Sistema Oficial de Cotizaciones</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">CUIT:</span>
          <span className="font-mono font-bold text-slate-200 bg-slate-850 px-2 py-0.5 rounded border border-slate-750">
            {COMPANY_INFO.formattedCuit}
          </span>
          <span className="hidden md:inline text-slate-400">({COMPANY_INFO.taxCondition})</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="hidden lg:inline flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Base de datos sincronizada
          </span>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 hover:text-white bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-md transition text-xs border border-slate-700"
              title="Opciones de Base de Datos y Exportación"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Exportar</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-slate-850 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200">
                <button
                  onClick={handleDownloadCSV}
                  className="w-full px-3 py-2 text-left hover:bg-slate-750 flex items-center gap-2 text-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-300" />
                  <div>
                    <p className="font-medium text-slate-100">Exportar a Excel / CSV</p>
                    <p className="text-[10px] text-slate-400">Historial completo con pliegos y montos</p>
                  </div>
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="w-full px-3 py-2 text-left hover:bg-slate-750 flex items-center gap-2 text-xs"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                  <div>
                    <p className="font-medium text-slate-100">Copia de Seguridad (JSON)</p>
                    <p className="text-[10px] text-slate-400">Respaldo de base de datos local</p>
                  </div>
                </button>
                <label className="w-full px-3 py-2 text-left hover:bg-slate-750 flex items-center gap-2 text-xs cursor-pointer border-t border-slate-750">
                  <Upload className="w-4 h-4 text-slate-300" />
                  <div>
                    <p className="font-medium text-slate-100">Restaurar Copia (JSON)</p>
                    <p className="text-[10px] text-slate-400">Subir archivo de backup</p>
                  </div>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>

                <button
                  onClick={() => {
                    if (window.confirm("¿Está seguro de que desea poner en cero el sistema? Se borrarán las cotizaciones y notificaciones de prueba para comenzar a cargar desde cero.")) {
                      resetSystemToZero();
                      onRefreshData();
                      setShowExportMenu(false);
                    }
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-rose-950/40 text-rose-300 flex items-center gap-2 text-xs border-t border-slate-750"
                  title="Limpiar base de datos y comenzar en cero"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-rose-300">Poner Sistema en Cero</p>
                    <p className="text-[10px] text-slate-400">Iniciar en blanco sin cotizaciones</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="h-12 sm:h-14 bg-slate-950 rounded-lg p-0.5 border border-cyan-500/30 shadow-md shadow-cyan-950/40 flex items-center justify-center shrink-0 overflow-hidden">
            <img 
              src={COMPANY_LOGO_URL} 
              alt={COMPANY_INFO.name} 
              className="h-full w-auto object-contain max-w-[150px] sm:max-w-[190px] rounded"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-white leading-tight">
                {COMPANY_INFO.name}
              </h1>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-1.5 py-0.2 rounded border border-slate-700">
                Oficial
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {COMPANY_INFO.tagline || 'Informática • Redes • Seguridad • Electricidad'}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onViewChange('metrics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentView === 'metrics'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Panel Principal</span>
          </button>

          <button
            onClick={() => onViewChange('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentView === 'kanban'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Tablero Kanban</span>
          </button>

          <button
            onClick={() => onViewChange('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentView === 'list'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Historial Completo</span>
          </button>
        </div>

        {/* Quick Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o pliego..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-slate-800 text-slate-100 placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-1.5 w-56 focus:w-64 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Responsables Button */}
          {onOpenTeamModal && (
            <button
              onClick={onOpenTeamModal}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 text-xs px-2.5 py-1.5 rounded-lg transition border border-slate-700/80 font-medium"
              title="Gestionar responsables de cotizaciones y licitaciones"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Responsables</span>
              {typeof teamMembersCount === 'number' && (
                <span className="bg-slate-900 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full border border-slate-700 font-mono">
                  {teamMembersCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications Bell Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition border border-slate-700/60"
            title="Centro de Notificaciones y Alertas"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Primary Action Button: New Quote / Bidding */}
          <div className="relative">
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Presupuesto</span>
            </button>

            {showNewMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl py-1.5 z-50 text-slate-200">
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onNewQuoteClick('privada');
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-start gap-3 transition"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 mt-0.5 border border-slate-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-white">Cotización Privada</p>
                    <p className="text-[11px] text-slate-400">Para clientes comerciales, empresas y particulares (COT-2026)</p>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onNewQuoteClick('licitacion');
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-start gap-3 transition"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 mt-0.5 border border-slate-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-xs text-white">Licitación del Estado</p>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono border border-slate-700">PLIEGO</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Con campos de pliego, organismo, fecha y hora de apertura (LIC-2026)</p>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onNewQuoteClick('privada', true);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-start gap-3 transition"
                >
                  <div className="p-1.5 rounded-lg bg-blue-950 text-blue-400 mt-0.5 border border-blue-900/60">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-xs text-white">Plantilla Rápida (Sin Cliente)</p>
                      <span className="text-[9px] bg-blue-900 text-blue-200 px-1.5 py-0.2 rounded font-mono">DIRECTO</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Cotizar ítems y precios de inmediato sin cargar datos del cliente</p>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                {onOpenTeamModal && (
                  <button
                    onClick={() => {
                      setShowNewMenu(false);
                      onOpenTeamModal();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-start gap-3 transition"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 mt-0.5 border border-slate-700">
                      <UserPlus className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-white">Gestionar Responsables</p>
                      <p className="text-[11px] text-slate-400">Agregar o eliminar firmas del equipo</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
