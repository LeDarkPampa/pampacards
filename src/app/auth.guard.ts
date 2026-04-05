import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthentificationService } from './services/authentification.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthentificationService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.isLoggedIn$.pipe(
      take(1),
      map((isLoggedIn: boolean) => {
        if (isLoggedIn) {
          return true;
        }
        this.router.navigate(['/accueil']);
        return false;
      }),
    );
  }
}
