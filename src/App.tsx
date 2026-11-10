import React, { useState, useEffect } from 'react';
import { Quote, AppNotification, QuoteType, QuoteStatus, TeamMember } from './types';
import { 
  getStoredQuotes, 
  saveQuote, 
  deleteQuote, 
  cloneQuote, 
  getStoredNotifications,
  addNotification,
  getStoredTeamMembers
} from './services/storage';
import { checkUpcomingDeadlines } from './services/notificationService';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { QuotesList } from './components/QuotesList';
import { DashboardMetrics } from './components/DashboardMetrics';
import { QuoteFormModal } from './components/QuoteFormModal';
import { QuoteDetailModal } from './components/QuoteDetailModal';
import { EmailModal } from './components/EmailModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { TeamMembersModal } from './components/TeamMembersModal';
import { downloadQuotePDF } from './services/pdfGenerator';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentView, setCurrentView] = useState<'kanban' | 'list' | 'metrics'>('metrics');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [formDefaultType, setFormDefaultType] = useState<QuoteType>('privada');
  const [formQuickMode, setFormQuickMode] = useState<boolean>(false);

  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [emailQuote, setEmailQuote] = useState<Quote | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // In-app Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 3500);
  };

  const loadData = () => {
    const loadedQuotes = getStoredQuotes();
    const loadedNotifications = getStoredNotifications();
    const loadedMembers = getStoredTeamMembers();
    setQuotes(loadedQuotes);
    setNotifications(loadedNotifications);
    setTeamMembers(loadedMembers);
    checkUpcomingDeadlines(loadedQuotes);
  };

  useEffect(() => {
    loadData();

    // Listen for storage updates
    const handleQuotesUpdated = () => {
      setQuotes(getStoredQuotes());
    };

    const handleNotificationsUpdated = () => {
      setNotifications(getStoredNotifications());
    };

    const handleTeamMembersUpdated = () => {
      setTeamMembers(getStoredTeamMembers());
    };

    window.addEventListener('quotes-updated', handleQuotesUpdated);
    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    window.addEventListener('team-members-updated', handleTeamMembersUpdated);

    // Periodic deadline checker every 60 seconds
    const interval = setInterval(() => {
      checkUpcomingDeadlines(getStoredQuotes());
    }, 60000);

    return () => {
      window.removeEventListener('quotes-updated', handleQuotesUpdated);
      window.removeEventListener('notifications-updated', handleNotificationsUpdated);
      window.removeEventListener('team-members-updated', handleTeamMembersUpdated);
      clearInterval(interval);
    };
  }, []);

  // Handlers
  const handleNewQuoteClick = (type: QuoteType = 'privada', isQuickMode = false) => {
    setEditingQuote(null);
    setFormDefaultType(type);
    setFormQuickMode(isQuickMode);
    setIsFormOpen(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setFormDefaultType(quote.type);
    setIsFormOpen(true);
    if (selectedQuote?.id === quote.id) {
      setSelectedQuote(null);
    }
  };

  const handleSaveQuote = (quote: Quote) => {
    const saved = saveQuote(quote);
    setQuotes(getStoredQuotes());
    setIsFormOpen(false);
    setEditingQuote(null);
    showToast(`Presupuesto ${saved.code} guardado exitosamente.`, 'success');
  };

  const handleDeleteQuote = (quoteId: string) => {
    deleteQuote(quoteId);
    setQuotes(getStoredQuotes());
    if (selectedQuote?.id === quoteId) setSelectedQuote(null);
    showToast('Cotización eliminada de la base de datos.', 'info');
  };

  const handleDuplicateQuote = (quoteId: string) => {
    const cloned = cloneQuote(quoteId);
    if (cloned) {
      setQuotes(getStoredQuotes());
      showToast(`Cotización duplicada con nuevo código correlativo: ${cloned.code}`, 'success');
      setSelectedQuote(cloned);
    }
  };

  const handleStatusChange = (quote: Quote, newStatus: QuoteStatus) => {
    const updated: Quote = {
      ...quote,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: "Usuario Operador",
          action: `Estado cambiado a '${newStatus.toUpperCase()}'`,
          details: `Actualizado desde el panel de control`
        },
        ...quote.activityLog
      ]
    };
    saveQuote(updated);
    setQuotes(getStoredQuotes());
    if (selectedQuote?.id === quote.id) {
      setSelectedQuote(updated);
    }
    showToast(`Estado de ${quote.code} actualizado a '${newStatus}'.`, 'info');
  };

  return (
    <div className={`min-h-screen ${currentView === 'metrics' ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'} flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-150`}>
      {/* App Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewQuoteClick={handleNewQuoteClick}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefreshData={loadData}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        teamMembersCount={teamMembers.length}
      />

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-0 relative ${currentView === 'metrics' ? 'bg-slate-100' : 'bg-slate-950'}`}>
        {currentView === 'kanban' && (
          <KanbanBoard
            quotes={quotes}
            onSelectQuote={setSelectedQuote}
            onEditQuote={handleEditQuote}
            onSendEmail={setEmailQuote}
            onUpdateQuote={(updated) => {
              saveQuote(updated);
              setQuotes(getStoredQuotes());
            }}
            searchQuery={searchQuery}
            onOpenTeamModal={() => setIsTeamModalOpen(true)}
          />
        )}

        {currentView === 'list' && (
          <QuotesList
            quotes={quotes}
            onSelectQuote={setSelectedQuote}
            onEditQuote={handleEditQuote}
            onDuplicateQuote={handleDuplicateQuote}
            onDeleteQuote={handleDeleteQuote}
            onSendEmail={setEmailQuote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewQuoteClick={handleNewQuoteClick}
          />
        )}

        {currentView === 'metrics' && (
          <DashboardMetrics
            quotes={quotes}
            onSelectQuote={setSelectedQuote}
            onNewQuoteClick={handleNewQuoteClick}
            onSendEmail={setEmailQuote}
            onViewChange={setCurrentView}
            onOpenTeamModal={() => setIsTeamModalOpen(true)}
          />
        )}
      </main>

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200 text-xs">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
          {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <QuoteFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingQuote(null);
          setFormQuickMode(false);
        }}
        onSave={handleSaveQuote}
        initialQuote={editingQuote}
        defaultType={formDefaultType}
        initialQuickMode={formQuickMode}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
      />

      <QuoteDetailModal
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        quote={selectedQuote}
        onEdit={handleEditQuote}
        onDuplicate={handleDuplicateQuote}
        onSendEmail={setEmailQuote}
        onStatusChange={handleStatusChange}
      />

      {emailQuote && (
        <EmailModal
          isOpen={!!emailQuote}
          onClose={() => setEmailQuote(null)}
          quote={emailQuote}
          onEmailSent={(updatedQuote) => {
            saveQuote(updatedQuote);
            setQuotes(getStoredQuotes());
            if (selectedQuote?.id === updatedQuote.id) {
              setSelectedQuote(updatedQuote);
            }
            showToast(`Correo y PDF de ${updatedQuote.code} despachados con éxito.`, 'success');
          }}
        />
      )}

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        quotes={quotes}
        onSelectQuote={(quoteId) => {
          const found = quotes.find(q => q.id === quoteId);
          if (found) setSelectedQuote(found);
        }}
      />

      <TeamMembersModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamMembers={teamMembers}
        onMemberAdded={(newMember) => {
          showToast(`Responsable "${newMember.name}" registrado correctamente.`, 'success');
        }}
      />
    </div>
  );
}
