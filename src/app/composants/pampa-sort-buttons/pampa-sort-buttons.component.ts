import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'app-pampa-sort-buttons',
  templateUrl: './pampa-sort-buttons.component.html',
  styleUrls: ['./pampa-sort-buttons.component.css']
})
export class PampaSortButtonsComponent {

  private _resetSort: boolean = false;
  @Input()
  set resetSort(value: boolean) {
    if (value) {
      this.etatTriClan = 'Aucun tri';
      this.etatTriNom = 'Aucun tri';
      this.etatTriRarete = 'Aucun tri';
      this.sortValue = 'no';
      this.emitSortEvent.emit('no');
    }
  }

  get resetSort(): boolean {
    return this._resetSort;
  }

  @Output() emitSortEvent = new EventEmitter();

  etatTriClan: string = 'Aucun tri';
  etatTriNom: string = 'Aucun tri';
  etatTriRarete: string = 'Aucun tri';
  sortValue: string = 'no';

  sortClan() {
    if (this.etatTriClan === 'Aucun tri') {
      this.etatTriClan = 'Tri ascendant';
      this.sortValue = 'asc';
    } else if (this.etatTriClan === 'Tri ascendant') {
      this.etatTriClan = 'Tri descendant';
      this.sortValue = 'desc';
    } else {
      this.etatTriClan = 'Aucun tri';
      this.sortValue = 'no';
    }
    this.etatTriNom = 'Aucun tri';
    this.etatTriRarete = 'Aucun tri';

    this.emitSortEvent.emit('clan-' + this.sortValue);
  }

  sortNom() {
    if (this.etatTriNom === 'Aucun tri') {
      this.etatTriNom = 'Tri ascendant';
      this.sortValue = 'asc';
    } else if (this.etatTriNom === 'Tri ascendant') {
      this.etatTriNom = 'Tri descendant';
      this.sortValue = 'desc';
    } else {
      this.sortValue = 'no';
      this.etatTriNom = 'Aucun tri';
    }
    this.etatTriClan = 'Aucun tri';
    this.etatTriRarete = 'Aucun tri';

    this.emitSortEvent.emit('nom-' + this.sortValue);
  }

  sortRarete() {
    if (this.etatTriRarete === 'Aucun tri') {
      this.etatTriRarete = 'Tri ascendant';
      this.sortValue = 'asc';
    } else if (this.etatTriRarete === 'Tri ascendant') {
      this.etatTriRarete = 'Tri descendant';
      this.sortValue = 'desc';
    } else {
      this.etatTriRarete = 'Aucun tri';
      this.sortValue = 'no';
    }
    this.etatTriClan = 'Aucun tri';
    this.etatTriNom = 'Aucun tri';

    this.emitSortEvent.emit('rarete-' + this.sortValue);
  }
}
