import {Component, Input} from '@angular/core';
import {IFormat} from "../../interfaces/IFormat";

@Component({
  selector: 'app-limitations-deck',
  templateUrl: './limitations-deck.component.html',
  styleUrls: ['./limitations-deck.component.css']
})
export class LimitationsDeckComponent {

  // @ts-ignore
  @Input() selectedFormat: IFormat;

}
