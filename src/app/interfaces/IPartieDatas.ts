import {IPlayerState} from "./IPlayerState";
import {IEvenementPartie} from "./IEvenementPartie";

export interface IPartieDatas {
  joueur: IPlayerState;
  adversaire: IPlayerState;
  finDePartie: boolean;
  lastEvent: IEvenementPartie;
  nomVainqueur: string;
  nomJoueurAbandon: string;
}
