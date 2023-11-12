  import {IFormat} from "./IFormat";
  import {ITypeCombat} from "./ITypeCombat";
  import {ICompetitionParticipant} from "./ICompetitionParticipant";

  export interface IAffrontement {
    id: number;
    joueur1Id: number;
    joueur2Id: number;
    scoreJ1: number;
    scoreJ2: number;
    deck1IdJ1: number;
    statutDeck1J1: boolean;
    deck2IdJ1: number;
    statutDeck2J1: boolean;
    deck3IdJ1: number;
    statutDeck3J1: boolean;
    deck1IdJ2: number;
    statutDeck1J2: boolean;
    deck2IdJ2: number;
    statutDeck2J2: boolean;
    deck3IdJ2: number;
    statutDeck3J2: boolean;
    vainqueurId:number;
    competitionId: number;
    isLigue: boolean;
  }
