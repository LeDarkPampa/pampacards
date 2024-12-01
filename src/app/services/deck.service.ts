import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable, of, throwError} from "rxjs";
import {AuthentificationService} from "./authentification.service";
import { catchError, map } from 'rxjs/operators';
import {Format} from "../classes/decks/Format";
import {ApiService} from "./api.service";
import {Deck} from "../classes/decks/Deck";
import {Carte} from "../classes/cartes/Carte";

@Injectable({
  providedIn: 'root'
})
export class DeckService extends ApiService {

  constructor(private http: HttpClient, private authService: AuthentificationService) {
    super();
  }

  saveDeck(deck: Deck): Observable<Deck[]> {
    return this.http.post<Deck[]>(this.API_URL + '/deck', deck);
  }

  deleteDeck(deck: Deck): Observable<void> {
    return this.http.request<void>('delete', this.API_URL + '/deck', { body: deck });
  }

  isDeckUtilise(selectedDeck: Deck): Observable<boolean> {
    const url = this.API_URL + `/isDeckUtilise?deckId=${selectedDeck.id}`;
    return this.http.get<boolean>(url).pipe(
      map((data: boolean) => data),
      catchError((error) => {
        console.error('There was an error!', error);
        return of(false);
      })
    );
  }

  validateDeck(deck: Deck, selectedFormat: Format, addedCard?: Carte): string | null {
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
      if (addedCard?.rarete === 4) {
        const numberOf4Stars = deck.cartes.filter(c => c.rarete === 4).length;

        if (numberOf4Stars == 3) {
          return 'Votre deck ne peut contenir que 3 cartes 4* dans le format STANDARD.';
        }
      } else {
        const numberOf4Stars = deck.cartes.filter(c => c.rarete === 4).length;

        if (numberOf4Stars > 3) {
          return 'Votre deck ne peut contenir que 3 cartes 4* dans le format STANDARD.';
        }
      }
    }

    if (selectedFormat.limitationCartes && addedCard) {
      const limitation = selectedFormat.limitationCartes.find(limitation => limitation.carte.id === addedCard.id);
      const carteQuantity = deck.cartes.filter(c => c.id === addedCard.id).length;

      if (limitation && carteQuantity >= limitation.limite) {
        return `Impossible d'ajouter la carte "${addedCard.nom}". La limitation de ${limitation.limite} exemplaire(s) est déjà atteinte.`;
      }
    }

    if (selectedFormat.limitationCartes) {
      for (const limitation of selectedFormat.limitationCartes) {
        const carteQuantity = deck.cartes.filter(c => c.id === limitation.carte.id).length;

        if (carteQuantity > limitation.limite) {
          return `Limitation non respectée.`;
        }
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
