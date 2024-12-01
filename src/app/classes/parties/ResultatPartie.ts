export class ResultatPartie {
  partieId: number;
  vainqueur: string;
  pseudoJoueurUn: string;
  scoreJoueurUn: number;
  jsonDeckJoueurUn: string;
  pseudoJoueurDeux: string;
  scoreJoueurDeux: number;
  jsonDeckJoueurDeux: string;

  constructor(
    partieId: number,
    vainqueur: string,
    pseudoJoueurUn: string,
    scoreJoueurUn: number,
    jsonDeckJoueurUn: string,
    pseudoJoueurDeux: string,
    scoreJoueurDeux: number,
    jsonDeckJoueurDeux: string
  ) {
    this.partieId = partieId;
    this.vainqueur = vainqueur;
    this.pseudoJoueurUn = pseudoJoueurUn;
    this.scoreJoueurUn = scoreJoueurUn;
    this.jsonDeckJoueurUn = jsonDeckJoueurUn;
    this.pseudoJoueurDeux = pseudoJoueurDeux;
    this.scoreJoueurDeux = scoreJoueurDeux;
    this.jsonDeckJoueurDeux = jsonDeckJoueurDeux;
  }
}
