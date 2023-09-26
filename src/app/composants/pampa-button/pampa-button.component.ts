import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-pampa-button',
  templateUrl: './pampa-button.component.html',
  styleUrls: ['./pampa-button.component.css']
})
export class PampaButtonComponent {
  @Input() texte: string = '';

  @Input() couleur: string = 'rouge';

  @Output() click = new EventEmitter();

  clicked() {
    this.click.emit();
  }
}
