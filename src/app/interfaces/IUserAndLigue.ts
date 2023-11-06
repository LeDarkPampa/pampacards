import {ITournoi} from "./ITournoi";
import {IUtilisateur} from "./IUtilisateur";
import {ILigue} from "./ILigue";
import {IDeck} from "./IDeck";

export interface IUserAndLigue {
  utilisateur: IUtilisateur;
  ligue: ILigue;
  decks: IDeck[];
}
