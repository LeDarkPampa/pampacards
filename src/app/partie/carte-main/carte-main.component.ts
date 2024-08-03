import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output, signal
} from '@angular/core';
import {ICarte} from "../../interfaces/ICarte";

@Component({
  selector: 'app-carte-main',
  templateUrl: './carte-main.component.html',
  styleUrls: ['./carte-main.component.css', '../../app.component.css']
})
export class CarteMainComponent implements OnInit {

  // @ts-ignore
  @Input() carte: ICarte;
  @Input() estJoueurActif: boolean = false;
  @Input() carteJouee: boolean = false;
  @Input() carteDefaussee: boolean = false;
  @Input() index: number = 0;
  @Output() jouer = new EventEmitter();
  @Output() defausser = new EventEmitter();
  @Output() clickedCarte = new EventEmitter();

  cadreOuvert = signal(false);

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
      this.cadreOuvert.set(false);
    }
  }

  ouvrirCadre() {
    this.cadreOuvert.set(true);
  }

  jouerCarte() {
    this.jouer.emit(this.index);
    this.cadreOuvert.set(false);
  }

  defausserCarte() {
    this.defausser.emit(this.index);
    this.cadreOuvert.set(false);
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
