import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-pampa-submit-button',
  templateUrl: './pampa-submit-button.component.html',
  styleUrls: ['./pampa-submit-button.component.css', '../../app.component.css']
})
export class PampaSubmitButtonComponent {

  @Input() texte: string = '';
  @Input() couleur: string = 'noir';
  @Input() taille: string = 'base';
}
