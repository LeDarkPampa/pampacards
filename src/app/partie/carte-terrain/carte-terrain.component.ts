import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ICarte} from "../../interfaces/ICarte";

@Component({
  selector: 'app-carte-terrain',
  templateUrl: './carte-terrain.component.html',
  styleUrls: ['./carte-terrain.component.css']
})
export class CarteTerrainComponent {

  // @ts-ignore
  @Input() carte: ICarte;
  // @ts-ignore
  @Input() estJoueurActif: boolean;
  @Output() clickedCarte = new EventEmitter();

  getPuissanceTotale(carte: ICarte) {
    return carte.prison ? 0 : (carte.puissance ? carte.puissance : 0) + (carte.diffPuissanceInstant ? carte.diffPuissanceInstant : 0) + (carte.diffPuissanceContinue ? carte.diffPuissanceContinue : 0);
  }

  generateStars(rarete: number): number[] {
    return Array(rarete).fill(0);
  }
}
