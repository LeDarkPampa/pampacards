import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ICarte} from "../../interfaces/ICarte";

@Component({
  selector: 'app-deck-card',
  templateUrl: './deck-card.component.html',
  styleUrls: ['./deck-card.component.css']
})
export class DeckCardComponent {

  // @ts-ignore
  @Input() carte: ICarte;

  @Output() clickedCarte = new EventEmitter();

  removeCard() {
    this.clickedCarte.emit();
  }

}
