export class Avatar {
  id: number;
  chapeau: string;
  tete: string;
  corps: string;
  dos: string;

  constructor(
    id: number,
    chapeau: string,
    tete: string,
    corps: string,
    dos: string
  ) {
    this.id = id;
    this.chapeau = chapeau;
    this.tete = tete;
    this.corps = corps;
    this.dos = dos;
  }
}
