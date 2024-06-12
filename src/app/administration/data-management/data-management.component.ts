import { Component } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {PropertiesService} from "../../services/properties.service";
import {IDeck} from "../../interfaces/IDeck";
import {IFormat} from "../../interfaces/IFormat";
import {ICarte} from "../../interfaces/ICarte";

@Component({
  selector: 'app-data-management',
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.css', '../../app.component.css']
})
export class DataManagementComponent {

  private API_BASE_URL = 'https://pampacardsback-57cce2502b80.herokuapp.com/api';

  decks: IDeck[] = [];
  formats: IFormat[] = [];

  constructor(private http: HttpClient, private propertiesService: PropertiesService) {

  }

  ngOnInit() {
    this.getAllFormats();
    this.getAllDecks();
  }

  supprimerParties() {
    this.http.get<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/deleteParties').subscribe({
      next: response => {
        alert('Parties supprimées');
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la suppression');
      }
    });
  }

  supprimerTchatParties() {
    this.http.get<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/deleteTchatParties').subscribe({
      next: response => {
        alert('Historique supprimé');
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la suppression');
      }
    });
  }

  updateProperties() {
    this.propertiesService.loadProperties();
  }

  updateDecks() {

    this.decks.forEach(deck => {
      deck.formats = [];
      this.formats.forEach(format => {
        if (this.validateDeck(deck, format) === null) {
          deck.formats.push(format);
        }
      })
    });

    this.http.post<IDeck[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/decks', this.decks).subscribe(data => {
      alert('Formats mis à jour');
    });
  }

  private getAllFormats() {
    this.http.get<IFormat[]>(`${this.API_BASE_URL}/formats`).subscribe({
      next: data => {
        this.formats = data;
      },
      error: error => {
        console.error('Erreur lors de la récupération des formats!', error);
      }
    });
  }

  private getAllDecks() {
    this.http.get<IDeck[]>(`${this.API_BASE_URL}/allDecks`).subscribe({
      next: data => {
        this.decks = data;
      },
      error: error => {
        console.error('Erreur lors de la récupération des formats!', error);
      }
    });
  }

  validateDeck(deck: IDeck, selectedFormat: IFormat, addedCard?: ICarte): string | null {
    const deckSizeLimit = 20;
    const cardLimit = 3;
    const rarityLimit44 = 44;

    // Vérification pour le format "MONO"
    if (selectedFormat.nom === 'MONO') {
      const uniqueClans: Set<number> = new Set([...deck.cartes.map(c => c.clan.id), ...(addedCard ? [addedCard.clan.id] : [])]);
      const uniqueTypes: Set<number> = new Set([...deck.cartes.map(c => c.type.id), ...(addedCard ? [addedCard.type.id] : [])]);

      if (uniqueClans.size > 1 && uniqueTypes.size > 1) {
        return 'Le deck MONO ne peut contenir que des cartes du même clan ou du même type.';
      }
    } else if (selectedFormat.nom === '44') {
      const totalRarity = deck.cartes.reduce((sum, card) => sum + card.rarete, addedCard?.rarete || 0);

      if (totalRarity > rarityLimit44) {
        return `Votre deck ne peut pas avoir une rareté totale supérieure à ${rarityLimit44} dans le format "44".`;
      }
    } else if (selectedFormat.nom === 'STANDARD') {
      // Vérification pour le format "STANDARD"
      const numberOf4Stars = deck.cartes.filter(c => c.rarete === 4).length;

      if (numberOf4Stars > 3) {
        return 'Votre deck ne peut contenir que 3 cartes 4* dans le format STANDARD.';
      }
    }

    if (selectedFormat.limitationCartes && addedCard) {
      const limitation = selectedFormat.limitationCartes.find(limitation => limitation.carte.id === addedCard.id);
      const carteQuantity = deck.cartes.filter(c => c.id === addedCard.id).length;

      if (limitation && carteQuantity >= limitation.limite) {
        return `Impossible d'ajouter la carte "${addedCard.nom}". La limitation de ${limitation.limite} exemplaire(s) est déjà atteinte.`;
      }
    }

    if (selectedFormat.nom !== 'NO LIMIT') {
      const cardQuantities: { [key: number]: number } = {};

      for (const card of [...deck.cartes, addedCard].filter(Boolean)) {
        if (card) {
          cardQuantities[card.id] = (cardQuantities[card.id] || 0) + 1;

          if (cardQuantities[card.id] > cardLimit) {
            const cardName = card.nom || addedCard?.nom || 'La carte';
            return `Impossible de sauvegarder. ${cardName} a plus de ${cardLimit} exemplaires.`;
          }
        }
      }
    }

    // Vérification de la taille totale du deck
    const deckSize = addedCard ? deck.cartes.length + 1 : deck.cartes.length;
    if (deckSize > deckSizeLimit) {
      return 'Impossible de mettre plus de vingt cartes';
    }

    return null;
  }
}
