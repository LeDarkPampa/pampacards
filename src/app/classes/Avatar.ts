export class Avatar {
  id: number;
  utilisateurId: number;
  chapeau: string;
  tete: string;
  corps: string;
  dos: string;

  constructor(
    id: number,
    utilisateurId: number,
    chapeau: string,
    tete: string,
    corps: string,
    dos: string
  ) {
    this.id = id;
    this.utilisateurId = utilisateurId;
    this.chapeau = chapeau;
    this.tete = tete;
    this.corps = corps;
    this.dos = dos;
  }
}
