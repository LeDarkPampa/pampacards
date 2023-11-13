import { Component } from '@angular/core';
import {IDeck} from "../../interfaces/IDeck";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
  selector: 'app-open-affrontement-dialog',
  templateUrl: './open-affrontement-dialog.component.html',
  styleUrls: ['./open-affrontement-dialog.component.css']
})
export class OpenAffrontementDialogComponent {
  // @ts-ignore
  decks: IDeck[];
  // @ts-ignore
  selectedDeck: IDeck;
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
