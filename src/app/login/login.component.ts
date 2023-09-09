import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "../services/authentification.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string;
  password: string;
  errorMessage: string;

  constructor(private authService: AuthentificationService, private router: Router) {
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
        this.router.navigate(['/']);
      },
      (error) => {
        console.error(error);
      }
    );
  }
}
