import { Injectable } from '@angular/core';
import {ICarte} from "../interfaces/ICarte";
import {EffetEnum} from "../interfaces/EffetEnum";

@Injectable({
  providedIn: 'root'
})
export class CarteService {

  constructor() { }

  nomCorrompu = 'Corrompu';

  getNomCorrompu(): string {
    return this.nomCorrompu;
  }

  isFidelite(carte: ICarte) {
    return carte.effet && carte.effet.code == EffetEnum.FIDELITE && !carte.silence;
  }

  isCauchemard(carte: ICarte) {
    return carte.effet && carte.effet.code == EffetEnum.CAUCHEMARD && !carte.silence;
  }

  memeTypeOuClan(c: ICarte, carte: ICarte) {
    return (c.clan.id == carte.clan.id || c.type.id == carte.type.id);
  }

  getPuissanceTotale(carte: ICarte) {
    return carte.prison ? 0 : (carte.puissance ? carte.puissance : 0) + (carte.diffPuissanceInstant ? carte.diffPuissanceInstant : 0) + (carte.diffPuissanceContinue ? carte.diffPuissanceContinue : 0);
  }

}
