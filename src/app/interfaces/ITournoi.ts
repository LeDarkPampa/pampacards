  import {IFormat} from "./IFormat";
  import {ITypeCombat} from "./ITypeCombat";
  import {ICompetitionParticipant} from "./ICompetitionParticipant";

  export interface ITournoi {
    id: number;
    nom: string;
    nombreDeJoueurs: number;
    statut: string;
    format: IFormat;
    typeCombat: ITypeCombat;
    participants: ICompetitionParticipant[];
  }
