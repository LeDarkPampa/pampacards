import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Effet } from '../../classes/cartes/Effet';
import { AuthentificationService } from "../../services/authentification.service";
import { PropertiesService } from "../../services/properties.service";
import { catchError } from 'rxjs/operators';
import { throwError, forkJoin } from 'rxjs';
import {ReferentielService} from "../../services/referentiel.service";
import {Carte} from "../../classes/cartes/Carte";
import {Type} from "../../classes/cartes/Type";
import {Clan} from "../../classes/cartes/Clan";

@Component({
  selector: 'app-card-management',
  templateUrl: './card-management.component.html',
  styleUrls: ['./card-management.component.css', '../../app.component.css']
})
export class CardManagementComponent implements OnInit {
  cartes: Carte[] = [];
  clans: Clan[] = [];
  types: Type[] = [];
  effets: Effet[] = [];
  selectedSort: string = 'clan';
  sortDirection: number = 1;

  constructor(
    private http: HttpClient,
    private authService: AuthentificationService,
    private propertiesService: PropertiesService,
    private referentielService: ReferentielService
  ) {}

  ngOnInit(): void {
    this.getAllCollection();
  }

  getAllCollection(): void {
    const isTestMode = this.authService.getUser().testeur && this.propertiesService.isTestModeOn();

    forkJoin({
      cartes: this.referentielService.getAllCartes(),
      clans: this.referentielService.getAllClans(),
      types: this.referentielService.getAllTypes(),
      effets: this.referentielService.getEffets()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des données', error);
        return throwError(error);
      })
    ).subscribe({
      next: (data: { cartes: Carte[], clans: Clan[], types: Type[], effets: Effet[] }) => {
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

  compareEffets(effet1: Effet, effet2: Effet): boolean {
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

  getContinuValue(carte: Carte): string {
    return carte.effet && carte.effet.continu ? "Oui" : "Non";
  }
}
