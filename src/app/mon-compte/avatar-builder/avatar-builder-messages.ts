export const AVATAR_UI = {
  ERROR: 'Erreur',
  WARN: 'Attention',
  SUCCESS: 'Avatar',
} as const;

export const AVATAR_MSG = {
  LOAD_FAILED: "Impossible de charger l'avatar ou le catalogue. Réessayez plus tard.",
  SAVE_FAILED: "La sauvegarde de l'avatar a échoué.",
  SAVED: 'Avatar enregistré.',
  PIECE_LOCKED: "Cet élément n'est pas encore débloqué.",
  LEAVE_CONFIRM: 'Des modifications non enregistrées seront perdues. Quitter quand même ?',
} as const;
