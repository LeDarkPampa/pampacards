import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-pampa-icon-button',
  templateUrl: './pampa-icon-button.component.html',
  styleUrls: ['./pampa-icon-button.component.css', '../../app.component.css']
})
export class PampaIconButtonComponent {
  @Input() icone: string = '';
  @Input() couleur: string = 'noir';
  @Input() taille: string = 'mini';

  @Output() clickBouton = new EventEmitter();

  clicked() {
    this.clickBouton.emit();
  }
}
