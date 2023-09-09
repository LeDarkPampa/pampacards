import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {Router} from "@angular/router";
import {IUtilisateur} from "../interfaces/IUtilisateur";

@Injectable({
  providedIn: 'root'
})
export class AuthentificationService {
  private apiUrl = 'https://pampacardsback-57cce2502b80.herokuapp.com/api/authenticate';
  isLoggedIn = false;
  // @ts-ignore
  user: IUtilisateur;
  userId: number;

  constructor(private http: HttpClient, private router: Router) {
    this.userId = 0;
  }

  login(login: string, password: string): Observable<boolean> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { login, password };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        const user = response.user;
        if (user) {
          this.isLoggedIn = true;
          this.user = user;
          this.userId = user.id;
          return true;
        } else {
          console.log('Nom d\'utilisateur ou mot de passe incorrect.');
          this.isLoggedIn = false;
          return false;
        }
      }),
    );
  }

  isLogged() {
    return this.isLoggedIn;
  }

  logout(): void {
    this.isLoggedIn = false;
    this.userId = 0;
    this.router.navigate(['/']);
  }
}
