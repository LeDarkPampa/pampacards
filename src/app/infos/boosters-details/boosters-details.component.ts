import { Component } from '@angular/core';
import {IBooster} from "../../interfaces/IBooster";
import { HttpClient } from "@angular/common/http";
import {ReferentielService} from "../../services/referentiel.service";

@Component({
  selector: 'app-boosters-details',
  templateUrl: './boosters-details.component.html',
  styleUrls: ['./boosters-details.component.css', '../../app.component.css']
})
export class BoostersDetailsComponent {

  boosters: IBooster[] = [];
  // @ts-ignore
  boosterSelectionne: IBooster;

  constructor(private http: HttpClient, private referentielService: ReferentielService) {
    this.referentielService.getAllBoosters().subscribe(boosters => {
      this.boosters = boosters;
    });
  }

  selectionnerBooster(booster: IBooster) {
    this.boosterSelectionne = booster;
  }

}
