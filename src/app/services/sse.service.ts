import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { IUtilisateur } from '../interfaces/IUtilisateur';
import {IDemandeCombat} from "../interfaces/IDemandeCombat";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import {IChatPartieMessage} from "../interfaces/IChatPartieMessage";
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root',
})
export class SseService extends  ApiService implements OnDestroy {

  // @ts-ignore
  // userListEventSource : une instance de EventSource qui est responsable de la réception des messages SSE de la liste des utilisateurs du serveur
  private userListEventSource: EventSource;

  // @ts-ignore
  private demandeCombatEventSource: EventSource;

  // @ts-ignore
  private evenementsPartieEventSource: EventSource;

  // @ts-ignore
  private chatMessagesEventSource: EventSource;

  // utilisateursSource : une instance de Subject de type IUtilisateur[] qui émettra une liste de tous les utilisateurs connectés en temps réel
  private utilisateursSource = new Subject<IUtilisateur[]>();

  private demandeCombatSource = new Subject<IDemandeCombat[]>();

  private evenementsPartieSource = new Subject<IEvenementPartie[]>();
  private evenementsChatSource = new Subject<IChatPartieMessage[]>();

  // usersToFight$ : un Observable de type IUtilisateur[] qui sera souscrit pour écouter les utilisateurs en temps réel connectés qui cherchent un combat
  public usersToFight$ = this.utilisateursSource.asObservable();

  public demandesDeCombat$ = this.demandeCombatSource.asObservable();

  public evenementsPartie$ = this.evenementsPartieSource.asObservable();

  public chatMessages$ = this.evenementsChatSource.asObservable();


  constructor() {
    super();}

  /**
   * La méthode getUsersSearchingFight() est responsable de la création et de l'initialisation de l'instance de EventSource
   * pour la liste des utilisateurs en temps réel connectés qui cherchent un combat.
   * Elle écoutera les messages SSE de la liste des utilisateurs du serveur et émettra la liste d'utilisateurs reçus sur utilisateursSource.
   */
  public getRechercheAdversairesFlux(): void {
    this.userListEventSource = new EventSource(
      this.API_URL + '/flux-utilisateurs'
    );
    this.userListEventSource.onopen = (event) =>
    this.userListEventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };
    this.userListEventSource.onmessage = (event) => {
      const utilisateurs = JSON.parse(event.data);
      this.utilisateursSource.next(utilisateurs);
    };
  }

  public getDemandeCombatFlux(): void {
    this.demandeCombatEventSource = new EventSource(
      this.API_URL + '/flux-demandesCombats'
    );
    this.demandeCombatEventSource.onopen = (event) => console.log(event);
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
      this.API_URL + '/flux-partieEvents?partieId=' + partieId
    );
    this.evenementsPartieEventSource.onopen = (event) => {
    }
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
      this.API_URL + '/flux-chatMessages?partieId=' + partieId
    );
    this.chatMessagesEventSource.onopen = (event) => {
    }
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
    if (this.userListEventSource) {
      this.userListEventSource.close();
    }

    if (this.demandeCombatEventSource) {
      this.demandeCombatEventSource.close();
    }
  }
}
