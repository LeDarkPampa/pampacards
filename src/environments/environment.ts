export const environment = {
  production: false,
  /** Origine du backend (sans slash final). Ex. local : 'http://localhost:8080' */
  apiBaseUrl: 'https://pampacardsback-57cce2502b80.herokuapp.com',
  /** Pseudos considérés comme administrateurs (contrôle d’accès UI). */
  adminPseudos: ['Pampa'] as const,
};
