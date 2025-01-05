import { Component, OnInit } from '@angular/core';
import { DefisService } from '../../services/defis.service';
import {Defi} from "../../classes/Defi";
import {AuthentificationService} from "../../services/authentification.service"; // Importez votre service

@Component({
  selector: 'app-defis-list',
  templateUrl: './defis-list.component.html',
  styleUrls: ['./defis-list.component.css']
})
export class DefisListComponent implements OnInit {
  defis: Defi[] = [];

  constructor(private defisService: DefisService, private authentificationService: AuthentificationService) {}

  ngOnInit(): void {
    this.loadDefis();
  }

  loadDefis(): void {
    this.defisService.getDefis(this.authentificationService.getUserId()).subscribe((defis: Defi[]) => {
      this.defis = defis;
    });
  }
}
