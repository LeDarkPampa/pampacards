import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import {CartePartie} from "../../classes/cartes/CartePartie";

@Component({
  selector: 'app-vision-cartes-dialog',
  templateUrl: './vision-cartes-dialog.component.html',
  styleUrls: ['./vision-cartes-dialog.component.css', '../../app.component.css']
})
export class VisionCartesDialogComponent implements OnInit {
  // @ts-ignore
  cartes: CartePartie[];

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    this.cartes = this.config.data.cartes;
  }

  fermer() {
    this.ref.close();
  }
}
