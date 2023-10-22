import { Component } from '@angular/core';
import {IPartie} from "../../interfaces/IPartie";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {IResultatPartie} from "../../interfaces/IResultatPartie";
import {ICarte} from "../../interfaces/ICarte";
import {VisionCartesDialogComponent} from "../../partie/vision-cartes-dialog/vision-cartes-dialog.component";
import {DialogService} from "primeng/dynamicdialog";

@Component({
  selector: 'app-administration-parties',
  templateUrl: './administration-parties.component.html',
  styleUrls: ['./administration-parties.component.css', '../../app.component.css']
})
export class AdministrationPartiesComponent {

  // @ts-ignore
  partiesEnCours: IPartie[];
  // @ts-ignore
  resultatsParties: IResultatPartie[];

  constructor(private http: HttpClient, private router: Router, private dialogService: DialogService) {
    this.http.get<IPartie[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partiesEnCours').subscribe({
      next: data => {
        this.partiesEnCours = data;
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des parties en cours');
      }
    });

    this.http.get<IResultatPartie[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/resultatsPartiesTerminees').subscribe({
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
    this.router.navigate(['/partie-obs', partieId]);
  }

  showDeck(jsonDeck: string) {
    // @ts-ignore
    const deck = jsonDeck.length > 0 ? JSON.parse(jsonDeck) : [];

    this.showVisionCartesDialog(deck);
  }

  showVisionCartesDialog(cartes: ICarte[]): void {
    const ref = this.dialogService.open(VisionCartesDialogComponent, {
      header: '',
      width: '50%',
      data: { cartes },
      closable: false
    });

    ref.onClose.subscribe(() => {
    });
  }
}
