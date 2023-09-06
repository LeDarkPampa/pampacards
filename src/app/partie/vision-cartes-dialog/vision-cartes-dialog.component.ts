import { Component, OnInit } from '@angular/core';
import { ICarte } from '../../interfaces/ICarte';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-vision-cartes-dialog',
  templateUrl: './vision-cartes-dialog.component.html',
  styleUrls: ['./vision-cartes-dialog.component.css']
})
export class VisionCartesDialogComponent implements OnInit {
  // @ts-ignore
  cartes: ICarte[];

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
