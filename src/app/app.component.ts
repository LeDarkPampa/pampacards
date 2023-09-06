import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { AuthentificationService } from './services/authentification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  constructor(
    private cd: ChangeDetectorRef,
    private authService: AuthentificationService
  ) {}

  ngOnInit() {
    this.cd.detectChanges();
  }

  isLoggedIn(): boolean {
    return this.authService.isLogged();
  }
}
