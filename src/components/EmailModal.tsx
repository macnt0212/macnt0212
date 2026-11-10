import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  FileText, 
  CheckCircle2, 
  Copy, 
  Paperclip,
  Users,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Quote } from '../types';
import { generateEmailTemplate, sendEmailNotification, EmailPayload } from '../services/emailService';
import { COMPANY_INFO } from '../services/companyConfig';
import { addNotification } from '../services/storage';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  onEmailSent: (updatedQuote: Quote) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  quote,
  onEmailSent
}) => {
  if (!isOpen) return null;

  const template = generateEmailTemplate(quote);

  const [to, setTo] = useState(quote.clientEmail || 'cliente@empresa.com');
  const [cc, setCc] = useState<string>(template.suggestedCc.join(', '));
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      alert("Por favor ingrese un destinatario.");
      return;
    }

    setIsSending(true);

    const ccList = cc.split(',').map(s => s.trim()).filter(Boolean);

    const payload: EmailPayload = {
      to: to.trim(),
      cc: ccList,
      subject: subject.trim(),
      body: body.trim(),
      quoteCode: quote.code,
      attachPdf: true
    };

    await sendEmailNotification(payload);

    setIsSending(false);
    setSentSuccess(true);

    // Update Quote
    const now = new Date().toISOString();
    const updatedQuote: Quote = {
      ...quote,
      status: quote.status === 'borrador' ? 'presentada' : quote.status,
      sentEmailsCount: (quote.sentEmailsCount || 0) + 1,
      lastSentAt: now,
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: now,
          user: "Módulo de Correo",
          action: "Correo electrónico enviado con PDF",
          details: `Enviado a ${to} con CC a ${ccList.join(', ')}`
        },
        ...quote.activityLog
      ]
    };

    // Add In-App notification
    addNotification({
      quoteId: quote.id,
      quoteCode: quote.code,
      type: 'email_sent',
      title: `Correo Despachado: ${quote.code}`,
      message: `Presupuesto y PDF enviados exitosamente a ${to}`,
      priority: 'info'
    });

    onEmailSent(updatedQuote);

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Enviar Notificación por Correo Electrónico
              </h2>
              <p className="text-xs text-slate-400">
                {quote.code} • Notificación automática al cliente y alertas al equipo de trabajo
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

        {sentSuccess ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-in zoom-in-75">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">¡Mensaje Despachado Correctamente!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Se ha remitido la propuesta oficial con el PDF adjunto a <span className="text-slate-200 font-medium">{to}</span> y se notificó a los responsables internos vía CC.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {/* Recipient To */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Para (Cliente / Organismo Convocante): <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="destinatario@cliente.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* CC Internal Team */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Con Copia Interna (CC a Responsables del Equipo):</span>
                </label>
                <span className="text-[10px] text-slate-400">Separados por coma</span>
              </div>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="mrossi@solucionesintegrales.com.ar, gerencia@solucionesintegrales.com.ar"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Asunto del Correo:
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cuerpo del Mensaje:
              </label>
              <textarea
                rows={9}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Attachment Badge */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">
                    {quote.code}_Soluciones_Integrales.pdf
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Documento oficial generado con CUIT {COMPANY_INFO.formattedCuit} y sello digital
                  </p>
                </div>
              </div>

              <span className="text-[10px] bg-slate-800 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                ADJUNTO AUTOMÁTICO
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Despachando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Correo y Notificar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
