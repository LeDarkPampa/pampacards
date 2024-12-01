export class DemandeCombat {
  id: number;
  joueurUnId: number;
  joueurDeuxId: number;
  joueurUnPseudo: string;
  joueurDeuxPseudo: string;
  deckUnId: number;
  deckDeuxId: number;
  nomDeckUn: string;
  formatId: number;
  partieId: number;
  message: string;
  firstPlayerId: number;
  erreur: string;
  status: string;

  constructor(
    id: number,
    joueurUnId: number,
    joueurDeuxId: number,
    joueurUnPseudo: string,
    joueurDeuxPseudo: string,
    deckUnId: number,
    deckDeuxId: number,
    nomDeckUn: string,
    formatId: number,
    partieId: number,
    message: string,
    firstPlayerId: number,
    erreur: string,
    status: string
  ) {
    this.id = id;
    this.joueurUnId = joueurUnId;
    this.joueurDeuxId = joueurDeuxId;
    this.joueurUnPseudo = joueurUnPseudo;
    this.joueurDeuxPseudo = joueurDeuxPseudo;
    this.deckUnId = deckUnId;
    this.deckDeuxId = deckDeuxId;
    this.nomDeckUn = nomDeckUn;
    this.formatId = formatId;
    this.partieId = partieId;
    this.message = message;
    this.firstPlayerId = firstPlayerId;
    this.erreur = erreur;
    this.status = status;
  }
}
