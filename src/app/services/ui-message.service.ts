import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { UI_SUMMARY } from '../core/messages/ui-messages';
import { httpErrorMessageFr } from '../core/http/http-error-log';

@Injectable({ providedIn: 'root' })
export class UiMessageService {
  private readonly lifeMs = 4500;

  constructor(private messageService: MessageService) {}

  success(detail: string, summary: string = UI_SUMMARY.SUCCESS): void {
    this.messageService.add({ severity: 'success', summary, detail, life: this.lifeMs });
  }

  error(detail: string, summary: string = UI_SUMMARY.ERROR): void {
    this.messageService.add({ severity: 'error', summary, detail, life: this.lifeMs });
  }

  warn(detail: string, summary: string = UI_SUMMARY.WARN): void {
    this.messageService.add({ severity: 'warn', summary, detail, life: this.lifeMs });
  }

  /** Détail utilisateur à partir d’une erreur HTTP ou autre. */
  errorFromHttp(err: unknown, summary: string = UI_SUMMARY.ERROR): void {
    this.error(httpErrorMessageFr(err), summary);
  }
}
