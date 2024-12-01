import {Component, Input} from '@angular/core';
import {Format} from "../../classes/decks/Format";

@Component({
  selector: 'app-limitations-deck',
  templateUrl: './limitations-deck.component.html',
  styleUrls: ['./limitations-deck.component.css', '../../app.component.css']
})
export class LimitationsDeckComponent {

  // @ts-ignore
  @Input() selectedFormat: Format;

}
