import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthentificationService } from './authentification.service';
import { PropertiesService } from './properties.service';
import { Type } from '../classes/cartes/Type';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class TypeService extends ApiService {
  constructor(
    private http: HttpClient,
    private authService: AuthentificationService,
    private propertiesService: PropertiesService
  ) {
    super();
  }

  getAllTypes(): Observable<Type[]> {
    let url = `${this.API_URL}/types`;

    if (this.authService.getUser().testeur && this.propertiesService.isTestModeOn()) {
      url = `${this.API_URL}/testTypes`;
    }

    return this.http.get<Type[]>(url).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }
}
