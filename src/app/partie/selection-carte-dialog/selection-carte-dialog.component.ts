import { Component, OnInit } from '@angular/core';
import { ICarte } from '../../interfaces/ICarte';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-selection-carte-dialog',
  templateUrl: './selection-carte-dialog.component.html',
  styleUrls: ['./selection-carte-dialog.component.css', '../../app.component.css']
})
export class SelectionCarteDialogComponent implements OnInit {
  // @ts-ignore
  cartes: ICarte[];
  // @ts-ignore
  carteSelectionnee: ICarte;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    this.cartes = this.config.data.cartes;
  }

  onCarteClick(carte: ICarte) {
    this.carteSelectionnee = carte;
  }

  selectionner() {
    if (this.carteSelectionnee) {
      this.ref.close(this.carteSelectionnee);
    }
  }
}
