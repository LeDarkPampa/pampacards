import {Component, OnInit} from '@angular/core';
import {Deck} from "../../classes/decks/Deck";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
  selector: 'app-open-affrontement-dialog',
  templateUrl: './open-affrontement-dialog.component.html',
  styleUrls: ['./open-affrontement-dialog.component.css']
})
export class OpenAffrontementDialogComponent implements OnInit {
  // @ts-ignore
  decks: Deck[];
  // @ts-ignore
  selectedDeck: Deck;
  hasValidDeck: boolean = true;

  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig) {

  }

  ngOnInit(): void {
    this.decks = this.config.data.decks;
    this.hasValidDeck = this.decks.length > 0;
  }

  accepter() {
    this.ref.close(this.selectedDeck);
  }

  refuser() {
    this.ref.close(null);
  }
}
