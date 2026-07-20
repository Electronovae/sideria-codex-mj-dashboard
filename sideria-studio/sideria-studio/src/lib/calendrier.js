// Calendrier sidérien : année de 350 jours, 5 saisons de 70 jours.
export const SAISONS = ["L'Éveil", "La Forge", "La Conjonction", "La Cendre", "Le Verrou"]
export const JPA = 350
export const JPS = 70

export const versJour = (an, sais = 0, jour = 1) => an * JPA + sais * JPS + (jour - 1)

export const depuisJour = (j) => {
  const an = Math.floor(j / JPA)
  const r = j - an * JPA
  const sais = Math.floor(r / JPS)
  return { an, sais, jour: r - sais * JPS + 1 }
}

export const fmtDate = (j, precision = 'jour') => {
  if (j == null) return ''
  const { an, sais, jour } = depuisJour(j)
  if (precision === 'an') return `An ${an}`
  if (precision === 'saison') return `${SAISONS[sais]}, An ${an}`
  return `${jour} ${SAISONS[sais]}, An ${an}`
}
