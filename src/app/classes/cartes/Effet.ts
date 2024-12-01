export class Effet {
  id: number;
  code: string;
  continu: boolean;
  conditionPuissanceAdverse: number;
  valeurBonusMalus: number;
  description: string;

  constructor(
    id: number,
    code: string,
    continu: boolean,
    conditionPuissanceAdverse: number,
    valeurBonusMalus: number,
    description: string
  ) {
    this.id = id;
    this.code = code;
    this.continu = continu;
    this.conditionPuissanceAdverse = conditionPuissanceAdverse;
    this.valeurBonusMalus = valeurBonusMalus;
    this.description = description;
  }
}
