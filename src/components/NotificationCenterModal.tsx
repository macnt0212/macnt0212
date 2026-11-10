import React from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Clock, 
  Calendar, 
  ExternalLink,
  ShieldAlert,
  Send
} from 'lucide-react';
import { AppNotification, Quote } from '../types';
import { 
  markAllNotificationsAsRead, 
  markNotificationAsRead, 
  addNotification 
} from '../services/storage';
import { 
  requestBrowserNotificationPermission, 
  sendBrowserNotification 
} from '../services/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onSelectQuote: (quoteId: string) => void;
  quotes: Quote[];
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectQuote,
  quotes
}) => {
  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const granted = await requestBrowserNotificationPermission();
    if (granted) {
      sendBrowserNotification(
        "¡Notificaciones Push Activadas!",
        "Recibirás alertas en tiempo real sobre aperturas de licitaciones y cambios de estado."
      );
      addNotification({
        title: "Notificaciones del Navegador Activadas",
        message: "El sistema tiene permisos para enviarte avisos de escritorio automáticos.",
        type: "system",
        priority: "info"
      });
    } else {
      alert("No se concedieron permisos de notificación en el navegador.");
    }
  };

  const handleTestNotification = () => {
    const licitacion = quotes.find(q => q.type === 'licitacion') || quotes[0];
    const testTitle = `Alerta de Apertura de Sobres: ${licitacion?.code || 'LIC-2026-0001'}`;
    const testMsg = `Faltan menos de 24 horas para el acto de apertura en ${licitacion?.clientName || 'Organismo Convocante'}.`;
    
    addNotification({
      quoteId: licitacion?.id,
      quoteCode: licitacion?.code,
      type: 'urgent_deadline',
      title: testTitle,
      message: testMsg,
      priority: 'alert'
    });

    sendBrowserNotification(testTitle, testMsg);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Centro de Notificaciones & Alertas
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} nuevas
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Aperturas de licitaciones, pliegos, envíos y alertas del equipo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="bg-slate-950/60 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnablePush}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 bg-blue-950/40 hover:bg-blue-900/40 px-2.5 py-1 rounded-md border border-blue-800/50 transition"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Activar Notificaciones Push</span>
            </button>
            <button
              onClick={handleTestNotification}
              className="text-slate-300 hover:text-white font-medium flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md border border-slate-700 transition"
            >
              <Send className="w-3 h-3 text-amber-400" />
              <span>Probar Alerta</span>
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Marcar todo como leído
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-800/40">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-sm">No hay notificaciones pendientes</p>
              <p className="text-xs text-slate-500 mt-1">Todas las alertas de licitaciones y cotizaciones están al día.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUrgent = notif.priority === 'alert';
              const isWarning = notif.priority === 'warning';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.quoteId) {
                      onSelectQuote(notif.quoteId);
                      onClose();
                    }
                  }}
                  className={`pt-3 first:pt-0 cursor-pointer group transition p-3 rounded-xl ${
                    !notif.read ? 'bg-slate-800/80 border border-slate-700/80' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                      isUrgent 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : isWarning 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {isUrgent ? (
                        <ShieldAlert className="w-4 h-4 animate-bounce" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-xs font-bold ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                            {notif.title}
                          </h4>
                          {notif.quoteCode && (
                            <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-blue-400 border border-slate-700">
                              {notif.quoteCode}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.quoteId && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-blue-400 group-hover:text-blue-300 font-medium">
                          <span>Ver detalle de la cotización</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
          Soluciones Integrales • Monitor de Licitaciones y Vencimientos
        </div>
      </div>
    </div>
  );
};
