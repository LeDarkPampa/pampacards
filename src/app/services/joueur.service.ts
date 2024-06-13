import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { IType } from '../interfaces/IType';
import {catchError} from "rxjs/operators";
import {AuthentificationService} from "./authentification.service";
import {PropertiesService} from "./properties.service";
import {ICarte} from "../interfaces/ICarte";
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
