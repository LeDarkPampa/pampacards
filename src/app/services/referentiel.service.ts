import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { IClan } from '../interfaces/IClan';
import {AuthentificationService} from "./authentification.service";
import {PropertiesService} from "./properties.service";
import {catchError} from "rxjs/operators";
import {Cacheable, LocalStorageStrategy} from "ts-cacheable";
import {IType} from "../interfaces/IType";
import {IFormat} from "../interfaces/IFormat";
import {ApiService} from "./api.service";
import {ICarte} from "../interfaces/ICarte";
import {IEffet} from "../interfaces/IEffet";
import {ITypeCombat} from "../interfaces/ITypeCombat";
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


  constructor(private http: HttpClient, private authService: AuthentificationService,
              private propertiesService: PropertiesService) {
    super();
  }

  @Cacheable({storageStrategy: LocalStorageStrategy, maxAge: 3600000})
  getAllClans(): Observable<IClan[]> {
    let url = this.API_URL + this.clansUrl;

    // @ts-ignore
    if (this.authService.getUser().testeur && this.propertiesService.isTestModeOn()) {
      url = this.API_URL + this.clansTestUrl;
    }

    return this.http.get<IClan[]>(url).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  @Cacheable({storageStrategy: LocalStorageStrategy, maxAge: 3600000})
  getAllTypes(): Observable<IType[]> {
    let url = this.API_URL + this.typessUrl;

    // @ts-ignore
    if (this.authService.getUser().testeur && this.propertiesService.isTestModeOn()) {
      url = this.API_URL + this.typesTestUrl;
    }

    return this.http.get<IType[]>(url).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getAllCartes(): Observable<ICarte[]> {
    let url = this.API_URL + this.cartesUrl;

    // @ts-ignore
    if (this.authService.getUser().testeur && this.propertiesService.isTestModeOn()) {
      url = this.API_URL + this.cartesTestUrl;
    }

    return this.http.get<ICarte[]>(url).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  @Cacheable({storageStrategy: LocalStorageStrategy, maxAge: 3600000})
  getAllFormats(): Observable<IFormat[]> {

    return this.http.get<IFormat[]>(this.API_URL + this.formatsUrl).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getEffets(): Observable<IEffet[]> {
    return this.http.get<IEffet[]>(this.API_URL + this.effetsUrl).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getAllTypesCombat(): Observable<ITypeCombat[]> {
    return this.http.get<ITypeCombat[]>(this.API_URL + this.typeCombatUrl).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }
}
