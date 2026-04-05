import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatPartieMessage } from '../classes/ChatPartieMessage';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TchatService extends ApiService {

  constructor(private http: HttpClient) {
    super();
  }

  sendMessage(message: string, partieId: number) {
    if (message && message != '') {
      const messageTchat: ChatPartieMessage = {
        id: 0,
        partieId: partieId,
        auteur: 'PampaBot',
        texte: message,
      };

      this.http.post(this.API_URL + '/chatMessages', messageTchat).subscribe();
    }
  }

  getChatMessages(partieId: number): Observable<ChatPartieMessage[]> {
    return this.http.get<ChatPartieMessage[]>(`${this.API_URL}/chatMessages?partieId=${partieId}`);
  }
}
