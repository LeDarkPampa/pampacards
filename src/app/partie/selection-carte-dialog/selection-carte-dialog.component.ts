import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import {CartePartie} from "../../classes/cartes/CartePartie";

@Component({
  selector: 'app-selection-carte-dialog',
  templateUrl: './selection-carte-dialog.component.html',
  styleUrls: ['./selection-carte-dialog.component.css', '../../app.component.css']
})
export class SelectionCarteDialogComponent implements OnInit {
  // @ts-ignore
  cartes: CartePartie[];
  // @ts-ignore
  carteSelectionnee: CartePartie;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    this.cartes = this.config.data.cartes;
  }

  onCarteClick(carte: CartePartie) {
    this.carteSelectionnee = carte;
  }

  selectionner() {
    if (this.carteSelectionnee) {
      this.ref.close(this.carteSelectionnee);
    }
  }
}
