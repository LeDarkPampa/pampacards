import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';
import {Carte} from "../../classes/cartes/Carte";
import {CartePartie} from "../../classes/cartes/CartePartie";

@Component({
  selector: 'app-carte-main-obs',
  templateUrl: './carte-main-obs.component.html',
  styleUrls: ['./carte-main-obs.component.css', '../../app.component.css']
})
export class CarteMainObsComponent implements OnInit {

  // @ts-ignore
  @Input() carte: CartePartie;
  @Input() estJoueurActif: boolean = false;
  @Input() carteJouee: boolean = false;
  @Input() carteDefaussee: boolean = false;
  @Input() index: number = 0;

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
  generateStars(rarete: number): number[] {
    return Array(rarete).fill(0);
  }

  getPuissanceTotale(carte: CartePartie) {
    return carte.prison ? 0 : (carte.puissance ? carte.puissance : 0) + (carte.diffPuissanceInstant ? carte.diffPuissanceInstant : 0) + (carte.diffPuissanceContinue ? carte.diffPuissanceContinue : 0);
  }

  isCarteCorrompu(carte: CartePartie) {
    return carte && carte.clan && carte.clan.nom === 'Corrompu';
  }
}
