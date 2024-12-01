import { Affrontement } from "../combats/Affrontement";

export class Round {
  id: number;
  tournoiId: number;
  roundNumber: number;
  affrontements: Affrontement[];

  constructor(id: number, tournoiId: number, roundNumber: number, affrontements: Affrontement[]) {
    this.id = id;
    this.tournoiId = tournoiId;
    this.roundNumber = roundNumber;
    this.affrontements = affrontements;
  }
}
