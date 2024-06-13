import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ICarte } from '../../interfaces/ICarte';
import { IClan } from '../../interfaces/IClan';
import { IType } from '../../interfaces/IType';
import { IEffet } from '../../interfaces/IEffet';
import { AuthentificationService } from "../../services/authentification.service";
import { PropertiesService } from "../../services/properties.service";
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, forkJoin } from 'rxjs';

@Component({
  selector: 'app-card-management',
  templateUrl: './card-management.component.html',
  styleUrls: ['./card-management.component.css', '../../app.component.css']
})
export class CardManagementComponent implements OnInit {
  cartes: ICarte[] = [];
  clans: IClan[] = [];
  types: IType[] = [];
  effets: IEffet[] = [];
  selectedSort: string = 'clan';
  sortDirection: number = 1;

  constructor(
    private http: HttpClient,
    private authService: AuthentificationService,
    private propertiesService: PropertiesService
  ) {}

  ngOnInit(): void {
    this.getAllCollection();
  }

  getAllCollection(): void {
    const isTestMode = this.authService.getUser().testeur && this.propertiesService.isTestModeOn();
    const cartesUrl = isTestMode ? 'https://pampacardsback-57cce2502b80.herokuapp.com/api/testCartes' : 'https://pampacardsback-57cce2502b80.herokuapp.com/api/cartes';
    const clansUrl = isTestMode ? 'https://pampacardsback-57cce2502b80.herokuapp.com/api/testClans' : 'https://pampacardsback-57cce2502b80.herokuapp.com/api/clans';
    const typesUrl = isTestMode ? 'https://pampacardsback-57cce2502b80.herokuapp.com/api/testTypes' : 'https://pampacardsback-57cce2502b80.herokuapp.com/api/types';

    forkJoin({
      cartes: this.http.get<ICarte[]>(cartesUrl),
      clans: this.http.get<IClan[]>(clansUrl),
      types: this.http.get<IType[]>(typesUrl),
      effets: this.http.get<IEffet[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/effets')
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des données', error);
        return throwError(error);
      })
    ).subscribe({
      next: (data: { cartes: ICarte[], clans: IClan[], types: IType[], effets: IEffet[] }) => {
        this.cartes = data.cartes;
        this.clans = data.clans;
        this.types = data.types;
        this.effets = data.effets;
        this.sortCards();
      }
    });
  }

  saveChanges(): void {
    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/updateCartes', this.cartes).subscribe({
      next: () => {
        alert('Cartes mises à jour');
      },
      error: error => {
        console.error('Erreur lors de la sauvegarde', error);
        alert('Erreur lors de la sauvegarde');
      }
    });
  }

  compareEffets(effet1: IEffet, effet2: IEffet): boolean {
    return effet1?.id === effet2?.id;
  }

  sortCards(): void {
    this.cartes.sort((a, b) => {
      let compareValueA, compareValueB;

      switch (this.selectedSort) {
        case 'clan':
          compareValueA = a.clan.nom;
          compareValueB = b.clan.nom;
          break;
        case 'type':
          compareValueA = a.type.nom;
          compareValueB = b.type.nom;
          break;
        case 'nom':
          compareValueA = a.nom;
          compareValueB = b.nom;
          break;
        default:
          // Par défaut, tri par clan
          compareValueA = a.clan.nom;
          compareValueB = b.clan.nom;
          break;
      }

      return (compareValueA < compareValueB ? -1 : compareValueA > compareValueB ? 1 : 0) * this.sortDirection;
    });
  }

  getContinuValue(carte: ICarte): string {
    return carte.effet && carte.effet.continu ? "Oui" : "Non";
  }
}
