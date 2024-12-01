import { Injectable } from '@angular/core';
import {CartePartie} from "../classes/cartes/CartePartie";
import {EffetEnum} from "../enums/EffetEnum";

@Injectable({
  providedIn: 'root'
})
export class CarteService {

  
  constructor() { }

  nomCorrompu = 'Corrompu';

  getNomCorrompu(): string {
    return this.nomCorrompu;
  }

  isFidelite(carte: CartePartie) {
    return carte.effet && carte.effet.code == EffetEnum.FIDELITE && !carte.silence;
  }

  isCauchemard(carte: CartePartie) {
    return carte.effet && carte.effet.code == EffetEnum.CAUCHEMARD && !carte.silence;
  }

  memeTypeOuClan(c: CartePartie, carte: CartePartie) {
    return (c.clan.id == carte.clan.id || c.type.id == carte.type.id);
  }

  getPuissanceTotale(carte: CartePartie) {
    return carte.prison ? 0 : (carte.puissance ? carte.puissance : 0) + (carte.diffPuissanceInstant ? carte.diffPuissanceInstant : 0) + (carte.diffPuissanceContinue ? carte.diffPuissanceContinue : 0);
  }

}
