import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {Router} from "@angular/router";
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {CookieService} from "ngx-cookie-service";

@Injectable({
  providedIn: 'root'
})
export class AuthentificationService {
  private apiUrl = 'https://pampacardsback-57cce2502b80.herokuapp.com/api/authenticate';

  constructor(private http: HttpClient, private router: Router, private cookieService: CookieService) {

  }

  login(login: string, password: string): Observable<boolean> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { login, password };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        const user = response.user;
        if (user) {
          this.cookieService.set('isLoggedIn', 'true');
          this.cookieService.set('userId', user.id.toString());
          localStorage.setItem('user', JSON.stringify(user));
          return true;
        } else {
          console.log('Nom d\'utilisateur ou mot de passe incorrect.');
          return false;
        }
      }),
    );
  }

  isLogged() {
    return this.cookieService.get('isLoggedIn') === 'true';
  }

  isAdmin() {
    // @ts-ignore
    return this.getUser() && this.getUser().pseudo == "Pampa";
  }

  getUser(): IUtilisateur | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    } else {
      return null;
    }
  }

  getUserId(): number {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user: IUtilisateur = JSON.parse(userData);
      return user.id;
    } else {
      return 0;
    }

  }

  logout(): void {
    this.cookieService.delete('isLoggedIn');
    this.cookieService.delete('userId');
    localStorage.removeItem('user');
    this.router.navigate(['/']);
  }
}
