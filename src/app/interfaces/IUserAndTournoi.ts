import {ITournoi} from "./ITournoi";
import {IUtilisateur} from "./IUtilisateur";

export interface IUserAndTournoi {
  utilisateur: IUtilisateur;
  tournoi: ITournoi;
}
