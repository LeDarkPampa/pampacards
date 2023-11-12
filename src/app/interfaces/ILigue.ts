  import {IUtilisateur} from "./IUtilisateur";
  import {IFormat} from "./IFormat";
  import {ITypeCombat} from "./ITypeCombat";
  import {ICompetitionParticipant} from "./ICompetitionParticipant";
  import {IAffrontement} from "./IAffrontement";

  export interface ILigue {
    id: number;
    nom: string;
    statut: string;
    format: IFormat;
    typeCombat: ITypeCombat;
    participants: ICompetitionParticipant[];
    affrontements: IAffrontement[];
  }
