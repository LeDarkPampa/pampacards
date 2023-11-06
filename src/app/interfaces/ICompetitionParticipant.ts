  import {IUtilisateur} from "./IUtilisateur";
  import {IFormat} from "./IFormat";
  import {ITypeCombat} from "./ITypeCombat";
  import {IDeck} from "./IDeck";

  export interface ICompetitionParticipant {
    id: number;
    utilisateur: IUtilisateur;
    decks: IDeck[];
  }
