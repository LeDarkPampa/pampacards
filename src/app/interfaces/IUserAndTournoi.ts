import {ITournoi} from "./ITournoi";
import {IUtilisateur} from "./IUtilisateur";
import {IDeck} from "./IDeck";

export interface IUserAndTournoi {
  utilisateur: IUtilisateur;
  tournoi: ITournoi;
  decks: IDeck[];
}
