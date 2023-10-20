import {Component, OnInit} from '@angular/core';
import {AuthentificationService} from "../services/authentification.service";
import {Router} from "@angular/router";
import {PropertiesService} from "../services/properties.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css', '../app.component.css']
})
export class LoginComponent implements OnInit {
  username: string;
  password: string;
  errorMessage: string;
  // @ts-ignore
  error: Message[];

  constructor(private authService: AuthentificationService, private propertiesService: PropertiesService,
              private router: Router) {
    this.username = '';
    this.password = '';
    this.errorMessage = '';
  }

  ngOnInit() {
    this.username = '';
    this.password = '';
    this.errorMessage = '';
  }

  onSubmit() {
    this.authService.login(this.username, this.password).subscribe(
      () => {
        this.propertiesService.loadProperties();
        this.router.navigate(['/']);
      },
      (error) => {
        console.error(error);
        this.error = [
          { severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la connexion' },
        ];
      }
    );
  }
}
