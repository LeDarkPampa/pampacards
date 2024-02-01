import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {ICarte} from "../../interfaces/ICarte";

@Component({
  selector: 'app-carte-main',
  templateUrl: './carte-main.component.html',
  styleUrls: ['./carte-main.component.css', '../../app.component.css']
})
export class CarteMainComponent implements OnInit, OnChanges {

  // @ts-ignore
  @Input() carte: ICarte;
  // @ts-ignore
  @Input() estJoueurActif: boolean;
  // @ts-ignore
  @Input() carteJouee: boolean;
  // @ts-ignore
  @Input() carteDefaussee: boolean;
  // @ts-ignore
  @Input() index: number;
  @Output() jouer = new EventEmitter();
  @Output() defausser = new EventEmitter();
  @Output() clickedCarte = new EventEmitter();

  cadreOuvert = false;

  constructor(private elementRef: ElementRef, private cd: ChangeDetectorRef) {}


  ngOnInit() {
    document.addEventListener('click', this.closeWindowIfClickedOutside);
    this.cd.detectChanges();
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['estJoueurActif'] && this.cadreOuvert) {
      this.cd.detectChanges();
    }
  }

  ouvrirCadre() {
    this.cadreOuvert = true;
  }

  jouerCarte() {
    this.jouer.emit(this.index);
    this.cadreOuvert = false;
  }

  defausserCarte() {
    this.defausser.emit(this.index);
    this.cadreOuvert = false;
  }

  generateStars(rarete: number): number[] {
    return Array(rarete).fill(0);
  }

  getPuissanceTotale(carte: ICarte) {
    return carte.prison ? 0 : (carte.puissance ? carte.puissance : 0) + (carte.diffPuissanceInstant ? carte.diffPuissanceInstant : 0) + (carte.diffPuissanceContinue ? carte.diffPuissanceContinue : 0);
  }

  isCarteCorrompu(carte: ICarte) {
    return carte && carte.clan && carte.clan.nom === 'Corrompu';
  }
}
