import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import {IDemandeCombat} from "../interfaces/IDemandeCombat";
import {DemandeCombatStatusEnum} from "../interfaces/DemandeCombatStatusEnum";
import {IDeck} from "../interfaces/IDeck";
import {AuthentificationService} from "../services/authentification.service";

@Component({
  selector: 'app-demande-combat-dialog',
  templateUrl: './demande-combat-dialog.component.html',
  styleUrls: ['./demande-combat-dialog.component.css', '../app.component.css']
})
export class DemandeCombatDialogComponent implements OnInit {

  // @ts-ignore
  demande: IDemandeCombat;
  // @ts-ignore
  decks: IDeck[];
  // @ts-ignore
  selectedDeck: IDeck;
  hasValidDeck: boolean = true;
  userId = 0;

  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig,
              private authService: AuthentificationService) {
    this.userId = authService.getUserId();
  }

  ngOnInit(): void {
    this.demande = this.config.data.demande;
    const decksValides: IDeck[] = this.config.data.decks;
    this.decks = decksValides.filter(deck => deck.format.nom == this.config.data.demande.nomFormat);
    this.hasValidDeck = this.decks.length > 0;
  }

  accepter() {
    this.demande.status = DemandeCombatStatusEnum.DEMANDE_ACCEPTEE;
    this.demande.deckDeuxId = this.selectedDeck.id;
    this.ref.close(this.demande);
  }

  refuser() {
    this.demande.status = DemandeCombatStatusEnum.DEMANDE_REFUSEE;
    this.ref.close(this.demande);
  }
}
