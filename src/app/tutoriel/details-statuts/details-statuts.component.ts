import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Type} from "../../classes/cartes/Type";
import {CartePartie} from "../../classes/cartes/CartePartie";

@Component({
  selector: 'app-details-statuts',
  templateUrl: './details-statuts.component.html',
  styleUrls: ['./details-statuts.component.css', '../../app.component.css']
})
export class DetailsStatutsComponent implements OnInit {

  // @ts-ignore
  normale: CartePartie;
  // @ts-ignore
  bouclier: CartePartie;
  // @ts-ignore
  insensible: CartePartie;
  // @ts-ignore
  corrompu: CartePartie;
  // @ts-ignore
  silence: CartePartie;
  // @ts-ignore
  indestructible: CartePartie;
  // @ts-ignore
  prison: CartePartie;
  private clanCorrompu: Type = {
    id: 0,
    nom: 'Corrompu'
  };

  private typeCorrompu: Type = {
    id: 0,
    nom: 'Corrompu'
  };

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.http.get<CartePartie>('https://pampacardsback-57cce2502b80.herokuapp.com/api/carte?carteId=' + 1110).subscribe({
      next: data => {
        let carte = data;
        carte.bouclier = false;
        carte.insensible = false;
        carte.silence = false;
        carte.prison = false;
        this.normale = {
          id: carte.id,
          nom: carte.nom,
          clan: carte.clan,
          type: carte.type,
          rarete: carte.rarete,
          effet: carte.effet,
          puissance: carte.puissance,
          image_path: carte.image_path,
          diffPuissanceInstant: carte.diffPuissanceInstant,
          diffPuissanceContinue: carte.diffPuissanceContinue,
          released: carte.released,
          silence: false,
          bouclier: false,
          insensible: false,
          prison: false,
          cartePartieId: 0
        }
        this.bouclier = {
          id: carte.id,
          nom: carte.nom,
          clan: carte.clan,
          type: carte.type,
          rarete: carte.rarete,
          effet: carte.effet,
          puissance: carte.puissance,
          image_path: carte.image_path,
          diffPuissanceInstant: carte.diffPuissanceInstant,
          diffPuissanceContinue: carte.diffPuissanceContinue,
          released: carte.released,
          silence: false,
          bouclier: true,
          insensible: false,
          prison: false,
          cartePartieId: 0
        };
        this.corrompu = {
          id: carte.id,
          nom: carte.nom,
          clan: this.clanCorrompu,
          type: this.typeCorrompu,
          rarete: carte.rarete,
          effet: carte.effet,
          puissance: carte.puissance,
          image_path: carte.image_path,
          diffPuissanceInstant: carte.diffPuissanceInstant,
          diffPuissanceContinue: carte.diffPuissanceContinue,
          released: carte.released,
          silence: false,
          bouclier: false,
          insensible: false,
          prison: false,
          cartePartieId: 0
        };
        this.insensible = {
          id: carte.id,
          nom: carte.nom,
          clan: carte.clan,
          type: carte.type,
          rarete: carte.rarete,
          effet: carte.effet,
          puissance: carte.puissance,
          image_path: carte.image_path,
          diffPuissanceInstant: carte.diffPuissanceInstant,
          diffPuissanceContinue: carte.diffPuissanceContinue,
          released: carte.released,
          silence: false,
          bouclier: false,
          insensible: true,
          prison: false,
          cartePartieId: 0
        };
        this.silence = {
          id: carte.id,
          nom: carte.nom,
          clan: carte.clan,
          type: carte.type,
          rarete: carte.rarete,
          effet: carte.effet,
          puissance: carte.puissance,
          image_path: carte.image_path,
          diffPuissanceInstant: carte.diffPuissanceInstant,
          diffPuissanceContinue: carte.diffPuissanceContinue,
          released: carte.released,
          silence: true,
          bouclier: false,
          insensible: false,
          prison: false,
          cartePartieId: 0
        };
        this.indestructible = {
          id: carte.id,
          nom: carte.nom,
          clan: carte.clan,
          type: carte.type,
          rarete: carte.rarete,
          effet: carte.effet,
          puissance: carte.puissance,
          image_path: carte.image_path,
          diffPuissanceInstant: carte.diffPuissanceInstant,
          diffPuissanceContinue: carte.diffPuissanceContinue,
          released: carte.released,
          silence: false,
          bouclier: true,
          insensible: false,
          prison: false,
          cartePartieId: 0
        };
        this.prison = {
          id: carte.id,
          nom: carte.nom,
          clan: carte.clan,
          type: carte.type,
          rarete: carte.rarete,
          effet: carte.effet,
          puissance: carte.puissance,
          image_path: carte.image_path,
          diffPuissanceInstant: carte.diffPuissanceInstant,
          diffPuissanceContinue: carte.diffPuissanceContinue,
          released: carte.released,
          silence: false,
          bouclier: false,
          insensible: false,
          prison: true,
          cartePartieId: 0
        };
        this.cd.detectChanges();
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }
}
