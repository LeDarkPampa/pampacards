import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {AuthentificationService} from "./authentification.service";
import {PropertiesService} from "./properties.service";
import {catchError} from "rxjs/operators";
import {Cacheable, LocalStorageStrategy} from "ts-cacheable";
import {Format} from "../classes/decks/Format";
import {ApiService} from "./api.service";
import {TypeCombat} from "../classes/TypeCombat";
import {Booster} from "../classes/Booster";
import {Utilisateur} from "../classes/Utilisateur";
import {Deck} from "../classes/decks/Deck";
import {Carte} from "../classes/cartes/Carte";
import {Clan} from "../classes/cartes/Clan";
import {Type} from "../classes/cartes/Type";
import {Effet} from "../classes/cartes/Effet";
@Injectable({
  providedIn: 'root'
})
export class ReferentielService extends ApiService {
  private clansTestUrl = '/testClans';
  private clansUrl = '/clans';
  private typesTestUrl = '/testTypes';
  private typessUrl = '/types';
  private formatsUrl = '/formats';
  cartesTestUrl = '/testCartes';
  private cartesUrl = '/cartes';
  private effetsUrl = '/effets';
  private typeCombatUrl = '/typesCombat';
  private boosterUrl = '/boosters';
  private usersUrl = '/users';
  private deckBaseUrl = '/decks-base';


  constructor(private http: HttpClient, private authService: AuthentificationService,
              private propertiesService: PropertiesService) {
    super();
  }

  @Cacheable({storageStrategy: LocalStorageStrategy, maxAge: 3600000})
  getAllClans(): Observable<Clan[]> {
    let url = this.API_URL + this.clansUrl;

    // @ts-ignore
    if (this.authService.getUser().testeur && this.propertiesService.isTestModeOn()) {
      url = this.API_URL + this.clansTestUrl;
    }

    return this.http.get<Clan[]>(url).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  @Cacheable({storageStrategy: LocalStorageStrategy, maxAge: 3600000})
  getAllTypes(): Observable<Type[]> {
    let url = this.API_URL + this.typessUrl;

    // @ts-ignore
    if (this.authService.getUser().testeur && this.propertiesService.isTestModeOn()) {
      url = this.API_URL + this.typesTestUrl;
    }

    return this.http.get<Type[]>(url).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getAllCartes(): Observable<Carte[]> {
    let url = this.API_URL + this.cartesUrl;

    // @ts-ignore
    if (this.authService.getUser().testeur && this.propertiesService.isTestModeOn()) {
      url = this.API_URL + this.cartesTestUrl;
    }

    return this.http.get<Carte[]>(url).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  @Cacheable({storageStrategy: LocalStorageStrategy, maxAge: 3600000})
  getAllFormats(): Observable<Format[]> {
    return this.http.get<Format[]>(this.API_URL + this.formatsUrl).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getEffets(): Observable<Effet[]> {
    return this.http.get<Effet[]>(this.API_URL + this.effetsUrl).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getAllTypesCombat(): Observable<TypeCombat[]> {
    return this.http.get<TypeCombat[]>(this.API_URL + this.typeCombatUrl).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getAllBoosters(): Observable<Booster[]> {
    return this.http.get<Booster[]>(this.API_URL + this.boosterUrl).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getAllUsers(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(this.API_URL + this.usersUrl).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getDecksBase(): Observable<Deck[]> {
    return this.http.get<Deck[]>(this.API_URL + this.deckBaseUrl).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }
}
