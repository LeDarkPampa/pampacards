import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
        catchError(error => {
          console.error('Erreur de récupération de l\'avatar :', error);
          return throwError('Erreur lors de la récupération de l\'avatar');
        })
      );
  }
}
