import {Component, OnInit} from '@angular/core';
import {IDeck} from "../../interfaces/IDeck";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {AuthentificationService} from "../../services/authentification.service";
import {IinscriptionCompetition} from "../../interfaces/IinscriptionCompetition";
import {ITournoi} from "../../interfaces/ITournoi";

@Component({
  selector: 'app-inscription-dialog',
  templateUrl: './inscription-dialog.component.html',
  styleUrls: ['./inscription-dialog.component.css', '../../app.component.css']
})
export class InscriptionDialogComponent implements OnInit {

  // @ts-ignore
  inscription: IinscriptionCompetition;
  // @ts-ignore
  competition: any;
  // @ts-ignore
  decks: IDeck[];
  // @ts-ignore
  selectedDecks: any[];
  hasValidDeck: boolean = true;
  userId = 0;

  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig,
              private authService: AuthentificationService) {
    this.userId = authService.getUserId();
  }

  ngOnInit(): void {
    this.competition = this.config.data.competition;
    this.decks = this.config.data.decks;
    this.hasValidDeck = this.decks.length > 0;
    this.selectedDecks = new Array(this.competition.typeCombat.nombreDeDecks).fill(null);
  }

  accepter() {
    this.inscription = {
      status: 'OK',
      decks: this.selectedDecks
    }
    this.ref.close(this.inscription);
  }

  refuser() {
    this.inscription = {
      status: 'KO',
      decks: []
    }
    this.ref.close(this.inscription);
  }

  generateRange(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  allDecksSelected(): boolean {
    return this.selectedDecks.every(deck => deck !== null);
  }

  areDecksUnique(): boolean {
    const selectedDeckIds = new Set();
    for (const deck of this.selectedDecks) {
      if (deck) {
        if (selectedDeckIds.has(deck.id)) {
          return false;
        }
        selectedDeckIds.add(deck.id);
      }
    }
    return true;
  }
}
