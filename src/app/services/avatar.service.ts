import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { Avatar } from '../classes/Avatar';
import { AuthentificationService } from './authentification.service';
import {catchError} from "rxjs/operators";
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class AvatarService extends ApiService {

  constructor(
    private http: HttpClient,
    private authentificationService: AuthentificationService) {
    super();
  }

  getAvatar(): Observable<Avatar> {
    const userId = this.authentificationService.getUserId();

    return this.http.get<Avatar>(this.API_URL + `/avatar?userId=${userId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 200) {
            // La réponse peut être vide ou incorrecte
            console.error("Réponse mal formatée ou vide", error);
          } else if (error.error instanceof ErrorEvent) {
            console.error("Erreur côté client ou réseau", error.error.message);
          } else {
            console.error(`Erreur serveur : ${error.status}, message : ${error.message}`);
          }
          return throwError('Erreur lors de la récupération de l\'avatar');
        })
      );
  }

  getAvatarByUserId(userId: number): Observable<Avatar> {
    return this.http.get<Avatar>(this.API_URL + `/avatar?userId=${userId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 200) {
            // La réponse peut être vide ou incorrecte
            console.error("Réponse mal formatée ou vide", error);
          } else if (error.error instanceof ErrorEvent) {
            console.error("Erreur côté client ou réseau", error.error.message);
          } else {
            console.error(`Erreur serveur : ${error.status}, message : ${error.message}`);
          }
          return throwError('Erreur lors de la récupération de l\'avatar');
        })
      );
  }

}
