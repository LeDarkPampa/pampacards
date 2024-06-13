import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { IType } from '../interfaces/IType';
import {catchError} from "rxjs/operators";
import {AuthentificationService} from "./authentification.service";
import {PropertiesService} from "./properties.service";
import {ICarte} from "../interfaces/ICarte";
import {EffetEnum} from "../interfaces/EffetEnum";

@Injectable({
  providedIn: 'root'
})
export class CarteService {

  constructor() { }

  isFidelite(carte: ICarte) {
    return carte.effet && carte.effet.code == EffetEnum.FIDELITE && !carte.silence;
  }

  isCauchemard(carte: ICarte) {
    return carte.effet && carte.effet.code == EffetEnum.CAUCHEMARD && !carte.silence;
  }

}
