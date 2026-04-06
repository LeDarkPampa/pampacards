export const MON_COMPTE_MSG = {
  PASSWORD_OK: 'Mot de passe modifié.',
  PASSWORD_ERR: 'Impossible de modifier le mot de passe.',
  PROMO_OK: 'Code promo validé.',
  PROMO_ERR: 'Code promo invalide ou déjà utilisé.',
  PROMO_EMPTY: 'Saisissez un code promo.',
} as const;

export const TOURNOIS_MSG = {
  INSCRIPTION_OK: 'Inscription enregistrée.',
  INSCRIPTION_ERR: "Impossible de finaliser l'inscription.",
  DESINSCRIPTION_OK: 'Désinscription enregistrée.',
  DESINSCRIPTION_ERR: 'Impossible de vous désinscrire.',
  LISTE_ERR: 'Impossible de charger les compétitions.',
  DECKS_LOAD_ERR: 'Impossible de charger vos decks.',
} as const;

export const COMBAT_MSG = {
  CHALLENGE_SENT: 'Demande de combat envoyée.',
  CHALLENGE_ERR: 'Impossible d’envoyer la demande de combat.',
  ACCEPTED: (pseudo: string) => `Combat accepté par ${pseudo}.`,
  PARTIE_CREATE_ERR: 'Impossible de créer la partie.',
  BOT_ERR: 'Impossible de lancer le défi contre le bot.',
} as const;

export const PARTIE_MSG = {
  AVATAR_ERR: "Impossible de charger l'avatar.",
} as const;

export const ADMIN_MSG = {
  PARTIES_OK: 'Parties supprimées.',
  TCHAT_OK: 'Historique de tchat supprimé.',
  DECKS_FORMAT_OK: 'Formats des decks mis à jour.',
  CARTES_OK: 'Cartes mises à jour.',
  CARTES_ERR: 'Impossible de sauvegarder les cartes.',
  COLLECTION_OK: 'Cartes ajoutées à la collection.',
  COLLECTION_ERR: 'Impossible d’ajouter les cartes.',
  USERS_ERR: 'Impossible de charger les utilisateurs.',
  DECKS_ERR: 'Impossible de charger les decks.',
  PARTIES_LOAD_ERR: 'Impossible de charger les parties.',
  RESULTATS_LOAD_ERR: 'Impossible de charger les résultats.',
  USER_CREATED: 'Utilisateur créé.',
  USER_CREATE_ERR: 'Impossible de créer l’utilisateur.',
  USER_REINIT: 'Utilisateur réinitialisé.',
  USER_REINIT_ERR: 'Impossible de réinitialiser l’utilisateur.',
  DATA_ERR: 'Opération impossible.',
} as const;

export const INFOS_MSG = {
  USERS_ERR: ADMIN_MSG.USERS_ERR,
  DECKS_ERR: ADMIN_MSG.DECKS_ERR,
  BOOSTERS_ERR: 'Impossible de charger les boosters.',
} as const;

export const CARTE_VIEW_MSG = {
  LOAD_ERR: 'Impossible de charger la carte.',
} as const;
