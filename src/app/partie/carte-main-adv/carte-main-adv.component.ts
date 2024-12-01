import {Component, Input} from '@angular/core';
import {CartePartie} from "../../classes/cartes/CartePartie";

@Component({
  selector: 'app-carte-main-adv',
  templateUrl: './carte-main-adv.component.html',
  styleUrls: ['./carte-main-adv.component.css', '../../app.component.css']
})
export class CarteMainAdvComponent {
  // @ts-ignore
  @Input() carte: CartePartie;

}
