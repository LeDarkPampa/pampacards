import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Utilisateur } from '../classes/Utilisateur';
import { EvenementPartie } from '../classes/parties/EvenementPartie';
import { ChatPartieMessage } from '../classes/ChatPartieMessage';
import { ApiService } from './api.service';
import {DemandeCombat} from "../classes/combats/DemandeCombat";

@Injectable({
  providedIn: 'root',
})
export class SseService extends ApiService implements OnDestroy {

  private userListEventSource!: EventSource;
  private demandeCombatEventSource!: EventSource;
  private evenementsPartieEventSource!: EventSource;
  private chatMessagesEventSource!: EventSource;

  private utilisateursSource = new Subject<Utilisateur[]>();
  private demandeCombatSource = new Subject<DemandeCombat[]>();
  private evenementsPartieSource = new Subject<EvenementPartie[]>();
  private evenementsChatSource = new Subject<ChatPartieMessage[]>();

  public usersToFight$ = this.utilisateursSource.asObservable();
  public demandesDeCombat$ = this.demandeCombatSource.asObservable();
  public evenementsPartie$ = this.evenementsPartieSource.asObservable();
  public chatMessages$ = this.evenementsChatSource.asObservable();

  constructor() {
    super();
  }

  public getRechercheAdversairesFlux(): void {
    this.userListEventSource = new EventSource(this.API_URL + '/flux-utilisateurs');
    this.userListEventSource.onopen = () => { };
    this.userListEventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };
    this.userListEventSource.onmessage = (event) => {
      const utilisateurs = JSON.parse(event.data);
      this.utilisateursSource.next(utilisateurs);
    };
  }

  public getDemandeCombatFlux(): void {
    this.demandeCombatEventSource = new EventSource(this.API_URL + '/flux-demandesCombats');
    this.demandeCombatEventSource.onopen = () => { };
    this.demandeCombatEventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };
    this.demandeCombatEventSource.onmessage = (event) => {
      const demandesCombats = JSON.parse(event.data);
      this.demandeCombatSource.next(demandesCombats);
    };
  }

  public getEvenementsPartieFlux(partieId: number): void {
    this.evenementsPartieEventSource = new EventSource(
      `${this.API_URL}/flux-partieEvents?partieId=${partieId}`
    );
    this.evenementsPartieEventSource.onopen = () => { };
    this.evenementsPartieEventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };
    this.evenementsPartieEventSource.onmessage = (event) => {
      const evenementsPartie = JSON.parse(event.data);
      this.evenementsPartieSource.next(evenementsPartie);
    };
  }

  public getChatMessagesFlux(partieId: number): void {
    this.chatMessagesEventSource = new EventSource(
      `${this.API_URL}/flux-chatMessages?partieId=${partieId}`
    );
    this.chatMessagesEventSource.onopen = () => { };
    this.chatMessagesEventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };
    this.chatMessagesEventSource.onmessage = (event) => {
      const chatMessages = JSON.parse(event.data);
      this.evenementsChatSource.next(chatMessages);
    };
  }

  closeUserListEventSource() {
    if (this.userListEventSource) {
      this.userListEventSource.close();
    }
  }

  closeDemandeCombatEventSource() {
    if (this.demandeCombatEventSource) {
      this.demandeCombatEventSource.close();
    }
  }

  closeEvenementsPartieEventSource() {
    if (this.evenementsPartieEventSource) {
      this.evenementsPartieEventSource.close();
    }
  }

  closeEvenementsChatEventSource() {
    if (this.chatMessagesEventSource) {
      this.chatMessagesEventSource.close();
    }
  }

  ngOnDestroy() {
    this.closeUserListEventSource();
    this.closeDemandeCombatEventSource();
    this.closeEvenementsPartieEventSource();
    this.closeEvenementsChatEventSource();
  }
}
