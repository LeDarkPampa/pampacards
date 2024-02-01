import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import {AuthentificationService} from "./services/authentification.service";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthentificationService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn$) {
      return true;
    } else {
      this.router.navigate(['/accueil']);
      return false;
    }
  }

}
