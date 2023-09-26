import {Component, Input} from '@angular/core';
import {ICarte} from "../../interfaces/ICarte";

@Component({
  selector: 'app-pampa-submit-button',
  templateUrl: './pampa-submit-button.component.html',
  styleUrls: ['./pampa-submit-button.component.css']
})
export class PampaSubmitButtonComponent {

  @Input() texte: String = '';
}
