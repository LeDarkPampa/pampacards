import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Carte} from "../../classes/cartes/Carte";

@Component({
  selector: 'app-deck-card',
  templateUrl: './deck-card.component.html',
  styleUrls: ['./deck-card.component.css', '../../app.component.css']
})
export class DeckCardComponent {

  // @ts-ignore
  @Input() carte: Carte;

  @Output() clickedCarte = new EventEmitter();

  removeCard() {
    this.clickedCarte.emit();
  }

  generateStars(rarete: number): number[] {
    return Array(rarete).fill(0);
  }

}
