import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-pampa-button-carre',
  templateUrl: './pampa-button-carre.component.html',
  styleUrls: ['./pampa-button-carre.component.css', '../../app.component.css']
})
export class PampaButtonCarreComponent {
  @Input() texte: string = '';
  @Input() couleur: string = 'rouge';
  @Input() taille: string = 'petit';

  @Output() clickBouton = new EventEmitter();

  clicked() {
    this.clickBouton.emit();
  }
}
