import {Component, ElementRef, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ICarte} from "../../interfaces/ICarte";

@Component({
  selector: 'app-carte-main',
  templateUrl: './carte-main.component.html',
  styleUrls: ['./carte-main.component.css']
})
export class CarteMainComponent implements OnInit {

  // @ts-ignore
  @Input() carte: ICarte;
  // @ts-ignore
  @Input() estJoueurActif: boolean;
  // @ts-ignore
  @Input() carteJouee: boolean;
  // @ts-ignore
  @Input() carteDefaussee: boolean;
  @Output() jouer = new EventEmitter();
  @Output() defausser = new EventEmitter();
  @Output() clickedCarte = new EventEmitter();

  cadreOuvert = false;

  constructor(private elementRef: ElementRef) {}


  ngOnInit() {
    document.addEventListener('click', this.closeWindowIfClickedOutside);
  }

  private closeWindowIfClickedOutside = (event: MouseEvent) => {
    if (!this.cadreOuvert) {
      return;
    }
    const targetElement = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(targetElement)) {
      this.cadreOuvert = false;
    }
  }

  ouvrirCadre(carte: ICarte) {
    this.cadreOuvert = true;
  }

  jouerCarte() {
    this.jouer.emit(this.carte.id);
    this.cadreOuvert = false;
  }

  defausserCarte() {
    this.defausser.emit(this.carte.id);
    this.cadreOuvert = false;
  }

  generateStars(rarete: number): number[] {
    return Array(rarete).fill(0);
  }

  getPuissanceTotale(carte: ICarte) {
    return carte.prison ? 0 : (carte.puissance ? carte.puissance : 0) + (carte.diffPuissanceInstant ? carte.diffPuissanceInstant : 0) + (carte.diffPuissanceContinue ? carte.diffPuissanceContinue : 0);
  }

}
