import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { IClan } from '../interfaces/IClan';
import {AuthentificationService} from "./authentification.service";
import {PropertiesService} from "./properties.service";
import {catchError} from "rxjs/operators";
@Injectable({
  providedIn: 'root'
})
export class ClanService {
  private clansTestUrl = 'https://pampacardsback-57cce2502b80.herokuapp.com/api/testClans';
  private clansUrl = 'https://pampacardsback-57cce2502b80.herokuapp.com/api/clans';

  constructor(private http: HttpClient, private authService: AuthentificationService,
              private propertiesService: PropertiesService) { }

  getAllClans(): Observable<IClan[]> {
    let url = this.clansUrl;

    if (this.authService.user.testeur && this.propertiesService.isTestModeOn()) {
      url = this.clansTestUrl;
    }

    return this.http.get<IClan[]>(url).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

}
