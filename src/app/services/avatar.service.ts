import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { Avatar } from '../classes/Avatar';
import { AuthentificationService } from './authentification.service';
import {catchError} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AvatarService {

  constructor(
    private http: HttpClient,
    private authentificationService: AuthentificationService
  ) { }

  getAvatar(): Observable<Avatar> {
    const userId = this.authentificationService.getUserId();
    return this.http.get<Avatar>(`/api/avatars/${userId}`);
  }

  getAvatarByUserId(userId: number): Observable<Avatar> {
    return this.http.get<Avatar>(`http://www.pampacards.fr/api/avatars/${userId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.error instanceof ErrorEvent) {
            console.error('Une erreur est survenue:', error.error.message);
          } else {
            console.error(`Code de statut : ${error.status}, ` +
              `Réponse du serveur : ${error.message}`);
          }
          alert('Erreur lors de la récupération de l\'avatar');
          return throwError('Erreur lors de la récupération de l\'avatar');
        })
      );
  }
}
