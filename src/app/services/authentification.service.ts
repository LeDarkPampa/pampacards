import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';
import {NavigationEnd, Router} from "@angular/router";
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {CookieService} from "ngx-cookie-service";

@Injectable({
  providedIn: 'root'
})
export class AuthentificationService {
  private apiUrl = 'https://pampacardsback-57cce2502b80.herokuapp.com/api/authenticate';

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.cookieService.get('isLoggedIn') === 'true');
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private cookieService: CookieService) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Mettez à jour l'état de connexion et de l'utilisateur à chaque changement de route.
        this.isLoggedInSubject.next(this.cookieService.get('isLoggedIn') === 'true');
      }
    });
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
          localStorage.removeItem('user');
          localStorage.setItem('user', JSON.stringify(user));

          // Émettre des événements pour informer les composants abonnés des changements d'état.
          this.isLoggedInSubject.next(true);

          return true;
        } else {
          console.log('Nom d\'utilisateur ou mot de passe incorrect.');
          return false;
        }
      }),
    );
  }

  isLogged(): Observable<boolean> {
    return this.isLoggedIn$;
  }

  isAdmin(): boolean {
    // Utilisez l'observable user$ pour éviter de déclencher une exception si getUser() renvoie null.

    return this.getUser() && this.getUser().pseudo === "Pampa";
  }

  getUser(): IUtilisateur {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  getUserId(): number {
    const user = this.getUser();
    return user ? user.id : 0;
  }

  logout(): void {
    this.cookieService.deleteAll();
    localStorage.removeItem('user');

    // Émettre des événements pour informer les composants abonnés des changements d'état.
    this.isLoggedInSubject.next(false);

    this.router.navigate(['/']);
  }
}
