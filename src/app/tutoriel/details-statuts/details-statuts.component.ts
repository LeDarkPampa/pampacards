import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ICarte} from "../../interfaces/ICarte";
import { HttpClient } from "@angular/common/http";
import {IClan} from "../../interfaces/IClan";
import {IType} from "../../interfaces/IType";

@Component({
  selector: 'app-details-statuts',
  templateUrl: './details-statuts.component.html',
  styleUrls: ['./details-statuts.component.css', '../../app.component.css']
})
export class DetailsStatutsComponent implements OnInit {

  // @ts-ignore
  normale: ICarte;
  // @ts-ignore
  bouclier: ICarte;
  // @ts-ignore
  insensible: ICarte;
  // @ts-ignore
  corrompu: ICarte;
  // @ts-ignore
  silence: ICarte;
  // @ts-ignore
  indestructible: ICarte;
  // @ts-ignore
  prison: ICarte;
  private clanCorrompu: IClan = {
    id: 0,
    nom: 'Corrompu'
  };

  private typeCorrompu: IType = {
    id: 0,
    nom: 'Corrompu'
  };

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.http.get<ICarte>('https://pampacardsback-57cce2502b80.herokuapp.com/api/carte?carteId=' + 1110).subscribe({
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
          prison: false
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
          prison: false
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
          prison: false
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
          prison: false
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
          prison: false
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
          prison: false
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
          prison: true
        };
        this.cd.detectChanges();
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }
}
