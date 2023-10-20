import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-pampa-on-off',
  templateUrl: './pampa-on-off.component.html',
  styleUrls: ['./pampa-on-off.component.css', '../../app.component.css']
})
export class PampaOnOffComponent {
  @Output() toggleChange = new EventEmitter<boolean>();

  public isChecked: boolean = true;

  toggleCheckbox() {
    this.isChecked = !this.isChecked;
    this.toggleChange.emit(this.isChecked);
  }
}
