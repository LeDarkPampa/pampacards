import {Component, Input} from '@angular/core';
import {ICarte} from "../../interfaces/ICarte";

@Component({
  selector: 'app-carte-main-adv',
  templateUrl: './carte-main-adv.component.html',
  styleUrls: ['./carte-main-adv.component.css']
})
export class CarteMainAdvComponent {
  // @ts-ignore
  @Input() carte: ICarte;

}
