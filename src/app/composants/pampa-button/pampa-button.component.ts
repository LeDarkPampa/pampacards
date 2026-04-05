import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-pampa-button',
  templateUrl: './pampa-button.component.html',
  styleUrls: ['./pampa-button.component.css', '../../app.component.css']
})
export class PampaButtonComponent {
  @Input() texte: string = '';
  @Input() couleur: string = 'rouge';
  @Input() taille: string = 'petit';
  @Input() disabled = false;

  @Output() clickBouton = new EventEmitter();

  clicked() {
    if (this.disabled) {
      return;
    }
    this.clickBouton.emit();
  }
}
