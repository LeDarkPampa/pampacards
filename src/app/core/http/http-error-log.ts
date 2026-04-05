import { HttpErrorResponse } from '@angular/common/http';
import { UI_HTTP_MSG } from '../messages/ui-messages';

/** Message court pour les logs console (français). */
export function httpErrorMessageFr(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return UI_HTTP_MSG.NETWORK;
    }
    if (error.status === 404) {
      return UI_HTTP_MSG.NOT_FOUND;
    }
    if (error.status === 403) {
      return UI_HTTP_MSG.FORBIDDEN;
    }
    if (error.status >= 500) {
      return UI_HTTP_MSG.SERVER;
    }
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return UI_HTTP_MSG.GENERIC;
}

/** Journalisation HTTP homogène (français), sans exposer d’anglais à l’utilisateur. */
export function logHttpErrorFr(error: unknown, method: string, url: string): void {
  const detail = httpErrorMessageFr(error);
  const status = error instanceof HttpErrorResponse ? error.status : '?';
  console.error(`[HTTP] ${method} ${url} — statut ${status} — ${detail}`, error);
}
