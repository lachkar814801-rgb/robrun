/**
 * Calcule le DPS (Dégâts Par Seconde) à partir des dégâts et de la cadence.
 * Formule : dégâts × cadence / 60, arrondi à l'entier le plus proche.
 * Tolérance de ±1 acceptée (comme spécifié dans le guide).
 */
export function calculateDPS(damage: number, rpm: number): number {
  return Math.round((damage * rpm) / 60);
}
