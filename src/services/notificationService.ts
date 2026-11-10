import { Quote } from '../types';
import { addNotification, getStoredNotifications } from './storage';

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function sendBrowserNotification(title: string, body: string, icon = '/vite.svg') {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon
      });
    } catch (err) {
      console.warn("Could not fire browser notification:", err);
    }
  }
}

export function checkUpcomingDeadlines(quotes: Quote[]) {
  const now = new Date();
  const existingNotifications = getStoredNotifications();

  quotes.forEach(quote => {
    // Check state tender opening date
    if (quote.type === 'licitacion' && quote.biddingDetails?.openingDate) {
      const opening = new Date(`${quote.biddingDetails.openingDate}T${quote.biddingDetails.openingTime || '10:00'}:00`);
      const diffMs = opening.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // If opening is within the next 72 hours and quote is active (not already adjudicada or rechazada)
      if (diffHours > 0 && diffHours <= 72 && quote.status !== 'adjudicada' && quote.status !== 'rechazada' && quote.status !== 'vencida') {
        const notifTitle = `Apertura Inminente: ${quote.code}`;
        const alreadyNotified = existingNotifications.some(n => 
          n.quoteId === quote.id && 
          n.type === 'urgent_deadline' && 
          (new Date().getTime() - new Date(n.timestamp).getTime() < 3600000 * 24)
        );

        if (!alreadyNotified) {
          const hoursLeft = Math.round(diffHours);
          const message = `La licitación '${quote.biddingDetails.docketNumber}' de ${quote.clientName} abre sobres en ${hoursLeft} horas (${quote.biddingDetails.openingDate} ${quote.biddingDetails.openingTime} hs).`;
          
          addNotification({
            quoteId: quote.id,
            quoteCode: quote.code,
            type: 'urgent_deadline',
            title: notifTitle,
            message,
            priority: hoursLeft <= 24 ? 'alert' : 'warning'
          });

          sendBrowserNotification(notifTitle, message);
        }
      }
    }
  });
}
