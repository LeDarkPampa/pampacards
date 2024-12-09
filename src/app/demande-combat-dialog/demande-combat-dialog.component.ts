import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import {DemandeCombatStatusEnum} from "../enums/DemandeCombatStatusEnum";
import {Deck} from "../classes/decks/Deck";
import {AuthentificationService} from "../services/authentification.service";
import {Format} from "../classes/decks/Format";
import { HttpClient } from "@angular/common/http";
import {ReferentielService} from "../services/referentiel.service";
import {DemandeCombat} from "../classes/combats/DemandeCombat";

@Component({
  selector: 'app-demande-combat-dialog',
  templateUrl: './demande-combat-dialog.component.html',
  styleUrls: ['./demande-combat-dialog.component.css', '../app.component.css']
})
export class DemandeCombatDialogComponent implements OnInit {

  // @ts-ignore
  demande: DemandeCombat;
  // @ts-ignore
  decks: Deck[];
  // @ts-ignore
  selectedDeck: Deck;
  hasValidDeck: boolean = true;
  formats: Format[] = [];
  userId = 0;

  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig,
              private authService: AuthentificationService, private http: HttpClient,
              private referentielService: ReferentielService) {
    this.userId = authService.getUserId();
  }

  ngOnInit(): void {
    this.demande = this.config.data.demande;
    const decksValides: Deck[] = this.config.data.decks;
    this.decks = decksValides.filter(deck =>
      deck.formats.some(format => format.formatId === this.config.data.demande.formatId));
    this.hasValidDeck = this.decks.length > 0;
    this.getAllFormats();
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

  getFormatNomById(formatId: number): string {
    const format = this.formats.find(format => format.formatId === formatId);
    return format ? format.nom : 'Format non trouvé';
  }

  private getAllFormats() {
    this.referentielService.getAllFormats().subscribe(formats => {
      this.formats = formats;
    });
  }
}
