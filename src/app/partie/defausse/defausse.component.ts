import {Component, Input} from '@angular/core';
import {CartePartie} from "../../classes/cartes/CartePartie";

@Component({
  selector: 'app-defausse',
  templateUrl: './defausse.component.html',
  styleUrls: ['./defausse.component.css', '../../app.component.css']
})
export class DefausseComponent {
  @Input() cartes: CartePartie[] = [];

}
