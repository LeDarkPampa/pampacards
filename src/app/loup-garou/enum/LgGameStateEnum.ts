export enum LgGameStateEnum {
  WAITING = "WAITING",         // En attente de joueurs
  ASSIGNING_ROLES = "ASSIGNING_ROLES", // Distribution des rôles
  NIGHT = "NIGHT",             // Phase de nuit (loups-garous agissent)
  DAY = "DAY",                 // Phase de jour
  VOTING = "VOTING",           // Phase de vote
  FINISHED = "FINISHED"        // Partie terminée
}
