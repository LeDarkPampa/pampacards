import {Component, OnInit} from '@angular/core';
import { AuthentificationService } from './services/authentification.service';
import {Router} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  constructor() {}

  ngOnInit() {
  }
}
