/** Libellés UI du deckbuilder (i18n ultérieure). */
export const DECK_BUILDER_UI = {
  SUMMARY_ERROR: 'Erreur',
  SUMMARY_WARN: 'Attention',
  SUMMARY_SAVE: 'Sauvegarde',
} as const;

export const DECK_BUILDER_MSG = {
  ERR_NO_NAME: 'Impossible de sauvegarder un deck sans nom.',
  ERR_DUPLICATE_NAME: 'Deux decks ne peuvent pas avoir le même nom.',
  ERR_NEED_20_CARDS: 'Le deck doit comporter 20 cartes.',
  ERR_NO_FORMAT: 'Impossible de sauvegarder un deck sans format.',
  ERR_DECK_INVALID_FORMAT: "Ce deck n'est pas valide pour ce format.",
  ERR_DELETE_DECK_IN_USE: 'Impossible de supprimer un deck utilisé en tournoi / ligue.',
  SUCCESS_SAVE: 'Deck sauvegardé.',
  /** Aligné sur la limite de taille (validateDeck / ajout de carte). */
  ERR_DECK_TOO_MANY_CARDS: 'Impossible de mettre plus de vingt cartes.',
} as const;
