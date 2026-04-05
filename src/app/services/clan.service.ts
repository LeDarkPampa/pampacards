import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthentificationService } from './authentification.service';
import { PropertiesService } from './properties.service';
import { catchError } from 'rxjs/operators';
import { Clan } from '../classes/cartes/Clan';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ClanService extends ApiService {
  constructor(
    private http: HttpClient,
    private authService: AuthentificationService,
    private propertiesService: PropertiesService
  ) {
    super();
  }

  getAllClans(): Observable<Clan[]> {
    let url = `${this.API_URL}/clans`;

    if (this.authService.getUser().testeur && this.propertiesService.isTestModeOn()) {
      url = `${this.API_URL}/testClans`;
    }

    return this.http.get<Clan[]>(url).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }
}
