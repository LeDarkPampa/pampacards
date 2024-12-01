export class TypeCombat {
  typeCombatId: number;
  nom: string;
  nombreDeDecks: number;

  constructor(typeCombatId: number, nom: string, nombreDeDecks: number) {
    this.typeCombatId = typeCombatId;
    this.nom = nom;
    this.nombreDeDecks = nombreDeDecks;
  }
}
