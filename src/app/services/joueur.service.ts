import { Injectable } from '@angular/core';
import {PlayerState} from "../classes/parties/PlayerState";
import {EffetEnum} from "../enums/EffetEnum";

@Injectable({
  providedIn: 'root'
})
export class JoueurService {

  constructor() { }

  hasCitadelle(joueur: PlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet && carte.effet.code == EffetEnum.CITADELLE) {
        result = true;
      }
    }

    return result;
  }

  hasCrypte(joueur: PlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet && carte.effet.code == EffetEnum.CRYPTE) {
        result = true;
      }
    }

    return result;
  }

  hasPalissade(joueur: PlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet && carte.effet.code == EffetEnum.PALISSADE) {
        result = true;
      }
    }

    return result;
  }

  hasProtecteurForet(joueur: PlayerState) {
    return joueur.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;
  }
}
