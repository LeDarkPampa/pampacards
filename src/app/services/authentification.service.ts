import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Router } from "@angular/router";
import { CookieService } from 'ngx-cookie-service';
import {IUtilisateur} from "../interfaces/IUtilisateur";

@Injectable({
  providedIn: 'root'
})
export class AuthentificationService {
  // @ts-ignore
  user: IUtilisateur;
  // @ts-ignore
  userId: number;
  private apiUrl = 'https://pampacardsback-57cce2502b80.herokuapp.com/api/authenticate';


  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) {}

  login(login: string, password: string): Observable<boolean> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { login, password };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        const user = response.user;
        if (user) {
          this.user = user;
          this.userId = user.id;
          // Enregistrez les informations d'authentification dans les cookies sécurisés
          this.cookieService.set('isLoggedIn', 'true');
          this.cookieService.set('userId', user.id.toString());
          // Restaurez l'état d'authentification
          return true;
        } else {
          console.log('Nom d\'utilisateur ou mot de passe incorrect.');
          return false;
        }
      }),
    );
  }

  isLogged() {
    // Vérifiez les cookies pour l'état d'authentification
    return this.cookieService.get('isLoggedIn') === 'true';
  }

  isAdmin() {
    return this.user && this.user.pseudo == "Pampa";
  }

  logout(): void {
    // Supprimez les cookies lors de la déconnexion
    this.cookieService.delete('isLoggedIn');
    this.cookieService.delete('userId');

    this.router.navigate(['/']);
  }
}
