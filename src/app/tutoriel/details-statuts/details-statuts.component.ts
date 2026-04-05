import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Type} from "../../classes/cartes/Type";
import {CartePartie} from "../../classes/cartes/CartePartie";
import { ReferentielService } from '../../services/referentiel.service';
import { UiMessageService } from '../../services/ui-message.service';
import { CARTE_VIEW_MSG } from '../../core/messages/domain.messages';

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

  constructor(
    private referentielService: ReferentielService,
    private cd: ChangeDetectorRef,
    private uiMessage: UiMessageService
  ) {
  }

  ngOnInit() {
    this.referentielService.getCarteById(1110).subscribe({
      next: (data) => {
        const carte = data as CartePartie;
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
      error: () => {
        this.uiMessage.error(CARTE_VIEW_MSG.LOAD_ERR);
      }
    });
  }
}
