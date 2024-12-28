import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Avatar } from '../classes/Avatar';
import { AuthentificationService } from './authentification.service';

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
    return this.http.get<Avatar>(`/api/avatars/${userId}`);
  }
}
