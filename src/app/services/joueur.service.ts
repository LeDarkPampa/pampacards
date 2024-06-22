import { Injectable } from '@angular/core';
import {EffetEnum} from "../interfaces/EffetEnum";
import {IPlayerState} from "../interfaces/IPlayerState";

@Injectable({
  providedIn: 'root'
})
export class JoueurService {

  constructor() { }

  hasCitadelle(joueur: IPlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet && carte.effet.code == EffetEnum.CITADELLE) {
        result = true;
      }
    }

    return result;
  }

  hasCrypte(joueur: IPlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet && carte.effet.code == EffetEnum.CRYPTE) {
        result = true;
      }
    }

    return result;
  }

  hasPalissade(joueur: IPlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet && carte.effet.code == EffetEnum.PALISSADE) {
        result = true;
      }
    }

    return result;
  }

  getJoueurHasProtecteurForet(joueur: IPlayerState) {
    return joueur.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;
  }
}
