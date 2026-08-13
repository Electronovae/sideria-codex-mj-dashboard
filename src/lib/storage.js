import { supabase } from './supabase.js'
import { universInitial, normaliser } from './modele.js'

const CLE = 'sideria-studio-univers'

// ── Local : autosave navigateur ─────────────────────────────
export function chargerLocal() {
  try {
    const brut = localStorage.getItem(CLE)
    if (brut) return normaliser(JSON.parse(brut))
  } catch (e) { console.warn('localStorage indisponible', e) }
  return normaliser(universInitial())
}
export function sauverLocal(univers) {
  try { localStorage.setItem(CLE, JSON.stringify(univers)) } catch (e) { /* mode privé, etc. */ }
}

// ── Fichier : export / import JSON (pour le vault Obsidian) ─
export function exporterJson(univers) {
  const blob = new Blob([JSON.stringify(univers, null, 1)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'sideria_univers.json'
  a.click()
  URL.revokeObjectURL(a.href)
}
export function importerJson(fichier) {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader()
    lecteur.onload = () => {
      try {
        const d = JSON.parse(lecteur.result)
        if (!d.meta || !d.pnjs) throw new Error('structure inattendue')
        resoudre(normaliser(d))
      } catch (e) { rejeter(e) }
    }
    lecteur.onerror = rejeter
    lecteur.readAsText(fichier)
  })
}

// ── Supabase : 12 tables normalisées, source de vérité ──────
export const supabaseActif = () => supabase != null

// Synchronise une table : upsert de toutes les lignes locales, puis suppression de celles
// qui ne sont plus dans l'univers local. `versLigne` convertit une entité locale (camelCase)
// en ligne Supabase (snake_case).
// Garde-fou : si le local est vide alors que la table distante ne l'est pas, on ne supprime
// rien (évite qu'un état local pas encore synchronisé, ex. juste après un déploiement, écrase
// des données qui n'existaient que côté Supabase).
async function syncTable(table, itemsLocaux, versLigne) {
  const lignes = itemsLocaux.map(versLigne)
  if (lignes.length) {
    const { error } = await supabase.from(table).upsert(lignes, { onConflict: 'id' })
    if (error) throw new Error(`${table} (upsert) : ${error.message}`)
  }
  const idsLocaux = lignes.map(l => l.id)
  const { data: existants, error: errSel } = await supabase.from(table).select('id')
  if (errSel) throw new Error(`${table} (lecture) : ${errSel.message}`)
  if (idsLocaux.length === 0 && (existants || []).length > 0) {
    console.warn(`${table} : local vide mais ${existants.length} ligne(s) côté Supabase, suppression ignorée par sécurité.`)
    return
  }
  const aSupprimer = (existants || []).map(e => e.id).filter(id => !idsLocaux.includes(id))
  if (aSupprimer.length) {
    const { error: errDel } = await supabase.from(table).delete().in('id', aSupprimer)
    if (errDel) throw new Error(`${table} (suppression) : ${errDel.message}`)
  }
}

// Remplace entièrement le contenu d'une table de jointure pure (sans id propre).
async function remplacerJointure(table, lignes, colonneParent, idsParent) {
  if (idsParent.length) {
    const { error: errDel } = await supabase.from(table).delete().in(colonneParent, idsParent)
    if (errDel) throw new Error(`${table} (purge) : ${errDel.message}`)
  }
  if (lignes.length) {
    const { error } = await supabase.from(table).insert(lignes)
    if (error) throw new Error(`${table} (insert) : ${error.message}`)
  }
}

export async function pousserSupabase(univers) {
  if (!supabase) throw new Error('Supabase non configuré (.env)')
  const u = univers

  // ── Passe 1 : toutes les tables, FK circulaires mises à null pour l'instant ──
  await syncTable('factions', u.factions, f => ({
    id: f.id, nom: f.nom, couleur: f.couleur || '', devise: f.devise || '',
    histoire: f.histoire || '', description: f.description || '', objectifs: f.objectifs || '',
    ressources: f.ressources || '', secrets: f.secrets || '', chef_id: null,
  }))

  await syncTable('pnjs', u.pnjs, p => ({
    id: p.id, nom: p.nom, role: p.role || '', poste: p.poste || '', superieur_id: null,
    image: p.image || '', description: p.description || '', secrets: p.secrets || '',
    repliques: p.repliques || [], compteurs: p.compteurs || [], arbre: p.arbre || null,
  }))

  // pnj_factions : jointure pure, reconstruite à partir de factionIds / rolesFactions
  {
    const lignes = []
    u.pnjs.forEach(p => {
      (p.factionIds || []).forEach(fid => {
        lignes.push({ pnj_id: p.id, faction_id: fid, role: (p.rolesFactions || {})[fid] || '' })
      })
    })
    await remplacerJointure('pnj_factions', lignes, 'pnj_id', u.pnjs.map(p => p.id))
  }

  await syncTable('lieux', u.lieux, l => ({
    id: l.id, nom: l.nom, type: l.type || '', faction_id: l.factionId || null,
    parent_id: null, description: l.description || '', secrets: l.secrets || '',
  }))

  await syncTable('joueurs', u.joueurs, j => ({
    id: j.id, joueur: j.joueur || '', personnage: j.personnage || '', classe: j.classe || '',
    niveau: j.niveau ?? 1, faction_id: j.faction || j.factionId || null, superieur_id: null,
    character_id: j.characterId || null, notes: j.notes || '', secrets: j.secrets || '',
    citations: j.citations || [], reputations: j.reputations || {},
  }))

  await syncTable('campagnes', u.campagnes, c => ({
    id: c.id, code: c.code || '', titre: c.titre, faction_id: c.factionId || null,
    saison: c.saison ?? 1, pitch: c.pitch || '', ton: c.ton || '', duree: c.duree || '',
    niveaux: c.niveaux || '', issues: c.issues || '', pnj_ids: c.pnjIds || [], actes: c.actes || [],
  }))

  // sessions et session_scenes sont imbriquées localement sous campagnes[].sessions[].sections
  const sessionsLocales = u.campagnes.flatMap(c => (c.sessions || []).map(s => ({ ...s, campagneId: c.id })))
  await syncTable('sessions', sessionsLocales, s => ({
    id: s.id, campagne_id: s.campagneId, code: s.code || '', titre: s.titre, date: s.date ?? null,
    resume: s.resume || '', statut: s.statut || 'ecriture', joueur_ids: s.joueurIds || [], ordre: s.ordre ?? 0,
  }))
  const scenesLocales = sessionsLocales.flatMap(s => (s.sections || []).map((sec, i) => ({ ...sec, sessionId: s.id, ordre: i })))
  await syncTable('session_scenes', scenesLocales, sec => ({
    id: sec.id, session_id: sec.sessionId, titre: sec.titre || '', description: sec.description || '',
    notes_mj: sec.notesMJ || '', lieu_id: sec.lieuId || null, ordre: sec.ordre ?? 0,
  }))

  await syncTable('evenements', u.evenements, e => ({
    id: e.id, titre: e.titre, desc_texte: e.desc || '', debut: e.debut, fin: e.fin ?? null,
    participants: e.participants || [], joueur_ids: e.joueurIds || [], faction_id: e.factionId || null,
    lieu_id: e.lieuId || null, campagne_id: e.campagneId || null, session_id: e.sessionId || null,
    importance: e.importance ?? 2, symbole: e.symbole || 'losange',
  }))

  await syncTable('rapports', u.rapports, r => ({
    id: r.id, titre: r.titre, type: r.type || 'rapport', date: r.date ?? null,
    auteur_id: r.auteurId || null, faction_id: r.factionId || null,
    visible_joueurs: !!r.visibleJoueurs, contenu: r.contenu || '',
  }))

  await syncTable('creatures', u.creatures, c => ({
    id: c.id, code: c.code || '', nom: c.nom, rang: c.rang || '', type: c.type || '',
    alignement: c.alignement || '', faction_id: c.factionId || null, equilibre: !!c.equilibre,
    ca: c.ca ?? null, ca_detail: c.caDetail || '', pv: c.pv ?? null, pv_detail: c.pvDetail || '',
    vitesse: c.vitesse || '', stats: c.stats || {}, jets_sauvegarde: c.jetsSauvegarde || '',
    competences: c.competences || '', immunites: c.immunites || '', resistances: c.resistances || '',
    sens: c.sens || '', langues: c.langues || '', facteur_puissance: c.facteurPuissance ?? null,
    equipement: c.equipement || {}, actions: c.actions || [], actions_bonus: c.actionsBonus || [],
    reactions: c.reactions || [], capacites: c.capacites || [], tactique_mj: c.tactiqueMj || '',
    prompt_image: c.promptImage || '', lore: c.lore || '', image: c.image || '',
  }))

  // joueurs_historique : jointure enrichie, reconstruite depuis joueurs[].historique
  {
    const lignes = u.joueurs.flatMap(j => (j.historique || []).map(h => ({
      id: h.id, joueur_id: j.id, type: h.type || 'interaction', date: h.date ?? null,
      pnj_id: h.pnjId || null, lieu_id: h.lieuId || null, campagne_id: h.campagneId || null,
      session_id: h.sessionId || null, resume: h.resume || '', effet: h.effet || '',
    })))
    await remplacerJointure('joueurs_historique', lignes, 'joueur_id', u.joueurs.map(j => j.id))
  }

  // meta : ligne unique (id booléen fixe)
  {
    const m = u.meta
    const { error } = await supabase.from('meta').upsert({
      id: true, nom: m.nom || '', these: m.these || '', date_campagne: m.dateCampagne ?? null,
      saisons: m.saisons || [], lignes_force: m.lignesForce || [], arbitrages: m.arbitrages || [],
    }, { onConflict: 'id' })
    if (error) throw new Error(`meta : ${error.message}`)
  }

  // ── Passe 2 : FK circulaires, maintenant que toutes les lignes existent ──
  for (const f of u.factions) {
    if (f.chefId) {
      const { error } = await supabase.from('factions').update({ chef_id: f.chefId }).eq('id', f.id)
      if (error) throw new Error(`factions (chef_id) : ${error.message}`)
    }
  }
  for (const p of u.pnjs) {
    if (p.superieurId) {
      const { error } = await supabase.from('pnjs').update({ superieur_id: p.superieurId }).eq('id', p.id)
      if (error) throw new Error(`pnjs (superieur_id) : ${error.message}`)
    }
  }
  for (const l of u.lieux) {
    if (l.parentId) {
      const { error } = await supabase.from('lieux').update({ parent_id: l.parentId }).eq('id', l.id)
      if (error) throw new Error(`lieux (parent_id) : ${error.message}`)
    }
  }
  for (const j of u.joueurs) {
    if (j.superieurId) {
      const { error } = await supabase.from('joueurs').update({ superieur_id: j.superieurId }).eq('id', j.id)
      if (error) throw new Error(`joueurs (superieur_id) : ${error.message}`)
    }
  }
}

export async function tirerSupabase() {
  if (!supabase) throw new Error('Supabase non configuré (.env)')

  const tables = ['factions', 'pnjs', 'pnj_factions', 'lieux', 'joueurs', 'joueurs_historique',
    'campagnes', 'sessions', 'session_scenes', 'evenements', 'rapports', 'meta', 'creatures']
  const res = {}
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*')
    if (error) throw new Error(`${t} (lecture) : ${error.message}`)
    res[t] = data || []
  }

  const pnjFactionsParPnj = {}
  res.pnj_factions.forEach(pf => {
    (pnjFactionsParPnj[pf.pnj_id] ||= []).push(pf)
  })

  const historiqueParJoueur = {}
  res.joueurs_historique.forEach(h => {
    (historiqueParJoueur[h.joueur_id] ||= []).push(h)
  })

  const scenesParSession = {}
  res.session_scenes.forEach(sec => {
    (scenesParSession[sec.session_id] ||= []).push(sec)
  })
  Object.values(scenesParSession).forEach(arr => arr.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)))

  const sessionsParCampagne = {}
  res.sessions.forEach(s => {
    (sessionsParCampagne[s.campagne_id] ||= []).push(s)
  })
  Object.values(sessionsParCampagne).forEach(arr => arr.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)))

  const m = res.meta[0] || {}

  const univers = {
    meta: {
      nom: m.nom || '', version: 1, these: m.these || '', dateCampagne: m.date_campagne ?? null,
      saisons: m.saisons || [], lignesForce: m.lignes_force || [], arbitrages: m.arbitrages || [],
    },
    factions: res.factions.map(f => ({
      id: f.id, nom: f.nom, couleur: f.couleur, devise: f.devise, histoire: f.histoire,
      description: f.description, objectifs: f.objectifs, ressources: f.ressources,
      secrets: f.secrets, chefId: f.chef_id,
    })),
    pnjs: res.pnjs.map(p => {
      const liens = pnjFactionsParPnj[p.id] || []
      return {
        id: p.id, nom: p.nom, role: p.role, poste: p.poste, superieurId: p.superieur_id,
        image: p.image, description: p.description, secrets: p.secrets,
        repliques: p.repliques || [], compteurs: p.compteurs || [], arbre: p.arbre,
        factionIds: liens.map(l => l.faction_id),
        rolesFactions: Object.fromEntries(liens.map(l => [l.faction_id, l.role || ''])),
      }
    }),
    lieux: res.lieux.map(l => ({
      id: l.id, nom: l.nom, type: l.type, factionId: l.faction_id, parentId: l.parent_id,
      description: l.description, secrets: l.secrets,
    })),
    joueurs: res.joueurs.map(j => ({
      id: j.id, joueur: j.joueur, personnage: j.personnage, classe: j.classe, niveau: j.niveau,
      faction: j.faction_id, superieurId: j.superieur_id, characterId: j.character_id,
      notes: j.notes, secrets: j.secrets, citations: j.citations || [], reputations: j.reputations || {},
      historique: (historiqueParJoueur[j.id] || []).map(h => ({
        id: h.id, type: h.type, date: h.date, pnjId: h.pnj_id, lieuId: h.lieu_id,
        campagneId: h.campagne_id, sessionId: h.session_id, resume: h.resume, effet: h.effet,
      })),
    })),
    arcs: [], // pas de table dédiée côté Supabase : reste local uniquement pour l'instant
    evenements: res.evenements.map(e => ({
      id: e.id, titre: e.titre, desc: e.desc_texte, debut: e.debut, fin: e.fin,
      participants: e.participants || [], joueurIds: e.joueur_ids || [], factionId: e.faction_id,
      lieuId: e.lieu_id, campagneId: e.campagne_id, arcId: null, symbole: e.symbole,
      sessionId: e.session_id, importance: e.importance,
    })),
    campagnes: res.campagnes.map(c => ({
      id: c.id, code: c.code, titre: c.titre, factionId: c.faction_id, saison: c.saison,
      arcId: null, pitch: c.pitch, ton: c.ton, duree: c.duree, niveaux: c.niveaux,
      actes: c.actes || [], pnjIds: c.pnj_ids || [], issues: c.issues,
      sessions: (sessionsParCampagne[c.id] || []).map(s => ({
        id: s.id, code: s.code, titre: s.titre, date: s.date, resume: s.resume, statut: s.statut,
        joueurIds: s.joueur_ids || [],
        sections: (scenesParSession[s.id] || []).map(sec => ({
          id: sec.id, titre: sec.titre, description: sec.description, notesMJ: sec.notes_mj,
          lieuId: sec.lieu_id,
        })),
      })),
    })),
    rapports: res.rapports.map(r => ({
      id: r.id, titre: r.titre, type: r.type, date: r.date, auteurId: r.auteur_id,
      factionId: r.faction_id, visibleJoueurs: r.visible_joueurs, contenu: r.contenu,
    })),
    creatures: res.creatures.map(c => ({
      id: c.id, code: c.code, nom: c.nom, rang: c.rang, type: c.type, alignement: c.alignement,
      factionId: c.faction_id, equilibre: c.equilibre, ca: c.ca, caDetail: c.ca_detail,
      pv: c.pv, pvDetail: c.pv_detail, vitesse: c.vitesse, stats: c.stats,
      jetsSauvegarde: c.jets_sauvegarde, competences: c.competences, immunites: c.immunites,
      resistances: c.resistances, sens: c.sens, langues: c.langues,
      facteurPuissance: c.facteur_puissance, equipement: c.equipement, actions: c.actions || [],
      actionsBonus: c.actions_bonus || [], reactions: c.reactions || [], capacites: c.capacites || [],
      tactiqueMj: c.tactique_mj, promptImage: c.prompt_image, lore: c.lore, image: c.image,
    })),
  }

  return normaliser(univers)
}
