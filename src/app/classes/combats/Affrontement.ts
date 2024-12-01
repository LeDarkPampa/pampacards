export class Affrontement {
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
  vainqueurId: number;
  competitionId: number;
  isLigue: boolean;
  partie1Id: number;
  partie2Id: number;
  partie3Id: number;
  partie4Id: number;
  partie5Id: number;
  roundId: number;

  constructor(
    id: number,
    joueur1Id: number,
    joueur2Id: number,
    scoreJ1: number,
    scoreJ2: number,
    deck1IdJ1: number,
    statutDeck1J1: boolean,
    deck2IdJ1: number,
    statutDeck2J1: boolean,
    deck3IdJ1: number,
    statutDeck3J1: boolean,
    deck1IdJ2: number,
    statutDeck1J2: boolean,
    deck2IdJ2: number,
    statutDeck2J2: boolean,
    deck3IdJ2: number,
    statutDeck3J2: boolean,
    vainqueurId: number,
    competitionId: number,
    isLigue: boolean,
    partie1Id: number,
    partie2Id: number,
    partie3Id: number,
    partie4Id: number,
    partie5Id: number,
    roundId: number
  ) {
    this.id = id;
    this.joueur1Id = joueur1Id;
    this.joueur2Id = joueur2Id;
    this.scoreJ1 = scoreJ1;
    this.scoreJ2 = scoreJ2;
    this.deck1IdJ1 = deck1IdJ1;
    this.statutDeck1J1 = statutDeck1J1;
    this.deck2IdJ1 = deck2IdJ1;
    this.statutDeck2J1 = statutDeck2J1;
    this.deck3IdJ1 = deck3IdJ1;
    this.statutDeck3J1 = statutDeck3J1;
    this.deck1IdJ2 = deck1IdJ2;
    this.statutDeck1J2 = statutDeck1J2;
    this.deck2IdJ2 = deck2IdJ2;
    this.statutDeck2J2 = statutDeck2J2;
    this.deck3IdJ2 = deck3IdJ2;
    this.statutDeck3J2 = statutDeck3J2;
    this.vainqueurId = vainqueurId;
    this.competitionId = competitionId;
    this.isLigue = isLigue;
    this.partie1Id = partie1Id;
    this.partie2Id = partie2Id;
    this.partie3Id = partie3Id;
    this.partie4Id = partie4Id;
    this.partie5Id = partie5Id;
    this.roundId = roundId;
  }
}
