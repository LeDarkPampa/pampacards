import {Component, OnInit} from '@angular/core';
import {Partie} from "../../classes/parties/Partie";
import { HttpClient } from "@angular/common/http";
import {Router} from "@angular/router";

import {ResultatPartie} from "../../classes/parties/ResultatPartie";
import {VisionCartesDialogComponent} from "../../partie/vision-cartes-dialog/vision-cartes-dialog.component";
import {DialogService} from "primeng/dynamicdialog";
import {AdministrationService} from "../../services/administration.service";
import {Carte} from "../../classes/cartes/Carte";

@Component({
  selector: 'app-administration-parties',
  templateUrl: './administration-parties.component.html',
  styleUrls: ['./administration-parties.component.css', '../../app.component.css']
})
export class AdministrationPartiesComponent implements OnInit {
  partiesEnCours: Partie[] = [];
  resultatsParties: ResultatPartie[] = [];

  constructor(private http: HttpClient, private router: Router, private dialogService: DialogService,
              private administrationService: AdministrationService) {

  }

  ngOnInit(): void {
    this.administrationService.getPartiesEnCours().subscribe({
      next: data => {
        this.partiesEnCours = data;
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des parties en cours');
      }
    });

    this.administrationService.getResultatsParties().subscribe({
      next: data => {
        this.resultatsParties = data;
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des parties en cours');
      }
    });
  }

  observerPartie(partieId: number) {
    this.router.navigate(['/partie-obs', partieId, 'obs']);
  }

  showDeck(jsonDeck: string) {
    const deck = jsonDeck.length > 0 ? JSON.parse(jsonDeck) : [];

    this.showVisionCartesDialog(deck);
  }

  showVisionCartesDialog(cartes: Carte[]): void {
    const ref = this.dialogService.open(VisionCartesDialogComponent, {
      header: '',
      width: '50%',
      data: { cartes },
      closable: false
    });

    ref.onClose.subscribe(() => {
    });
  }

  openReplay(partieId: any) {
    this.router.navigate(['/partie-obs', partieId, 'replay']);
  }
}
