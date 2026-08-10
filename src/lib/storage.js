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

// ── Supabase : schéma normalisé (12 tables) ──────────────────
// Le MJ ne travaille qu'avec l'objet `univers` en mémoire (comme avant).
// pousserSupabase / tirerSupabase font toute la traduction avec les tables.
export const supabaseActif = () => supabase != null

const VIDE = '00000000-0000-0000-0000-000000000000' // id qui n'existe jamais : sert à "supprimer tout" sans liste vide

// Remplace le contenu d'une table par exactement `rows` (upsert + suppression des lignes absentes).
async function synchroniser(table, rows) {
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows)
    if (error) throw new Error(`${table} (upsert) : ${error.message}`)
  }
  const suppr = supabase.from(table).delete()
  const { error } = rows.length
    ? await suppr.not('id', 'in', `(${rows.map(r => r.id).join(',')})`)
    : await suppr.neq('id', VIDE)
  if (error) throw new Error(`${table} (purge) : ${error.message}`)
}

export async function pousserSupabase(univers) {
  if (!supabase) throw new Error('Supabase non configuré (.env)')
  const u = univers

  // ── Phase 1 : toutes les entités, sans les FK circulaires ──
  const factions = u.factions.map(f => ({
    id: f.id, nom: f.nom, couleur: f.couleur, devise: f.devise, histoire: f.histoire,
    description: f.description, objectifs: f.objectifs, ressources: f.ressources, secrets: f.secrets,
    chef_id: null,
  }))
  const pnjs = u.pnjs.map(p => ({
    id: p.id, nom: p.nom, role: p.role, poste: p.poste, superieur_id: null, image: p.image,
    description: p.description, secrets: p.secrets, repliques: p.repliques, compteurs: p.compteurs, arbre: p.arbre,
  }))
  const lieux = u.lieux.map(l => ({
    id: l.id, nom: l.nom, type: l.type, faction_id: l.factionId, parent_id: null,
    description: l.description, secrets: l.secrets,
  }))
  const joueurs = u.joueurs.map(j => ({
    id: j.id, joueur: j.joueur, personnage: j.personnage, classe: j.classe, niveau: j.niveau,
    faction_id: j.faction, superieur_id: null, notes: j.notes, secrets: j.secrets,
    citations: j.citations, reputations: j.reputations,
  }))
  const campagnes = u.campagnes.map(c => ({
    id: c.id, code: c.code, titre: c.titre, faction_id: c.factionId, saison: c.saison,
    pitch: c.pitch, ton: c.ton || '', duree: c.duree, niveaux: c.niveaux, issues: c.issues,
    pnj_ids: c.pnjIds, actes: c.actes || [],
  }))
  const sessions = [], scenes = []
  u.campagnes.forEach(c => {
    c.sessions.forEach((s, i) => {
      sessions.push({
        id: s.id, campagne_id: c.id, code: s.code, titre: s.titre, date: s.date, resume: s.resume,
        statut: s.statut, joueur_ids: s.joueurIds, ordre: i,
      })
      s.sections.forEach((sec, j) => {
        scenes.push({
          id: sec.id, session_id: s.id, titre: sec.titre, description: sec.description,
          notes_mj: sec.notesMJ, lieu_id: sec.lieuId, ordre: j,
        })
      })
    })
  })
  const evenements = u.evenements.map(e => ({
    id: e.id, titre: e.titre, desc_texte: e.desc, debut: e.debut, fin: e.fin,
    participants: e.participants, joueur_ids: e.joueurIds, faction_id: e.factionId,
    lieu_id: e.lieuId, campagne_id: e.campagneId, session_id: e.sessionId,
    importance: e.importance, symbole: e.symbole,
  }))
  const rapports = u.rapports.map(r => ({
    id: r.id, titre: r.titre, type: r.type, date: r.date, auteur_id: r.auteurId,
    faction_id: r.factionId, visible_joueurs: r.visibleJoueurs, contenu: r.contenu,
  }))
  const historique = []
  u.joueurs.forEach(j => {
    j.historique.forEach(h => historique.push({
      id: h.id, joueur_id: j.id, type: h.type, date: h.date, pnj_id: h.pnjId, lieu_id: h.lieuId,
      campagne_id: h.campagneId, session_id: h.sessionId, resume: h.resume, effet: h.effet,
    }))
  })
  const pnjFactions = []
  u.pnjs.forEach(p => {
    (p.factionIds || []).forEach(fid => pnjFactions.push({
      pnj_id: p.id, faction_id: fid, role: (p.rolesFactions && p.rolesFactions[fid]) || '',
    }))
  })

  await synchroniser('factions', factions)
  await synchroniser('pnjs', pnjs)
  await synchroniser('lieux', lieux)
  await synchroniser('joueurs', joueurs)
  await synchroniser('campagnes', campagnes)
  await synchroniser('sessions', sessions)
  await synchroniser('session_scenes', scenes)
  await synchroniser('evenements', evenements)
  await synchroniser('rapports', rapports)
  await synchroniser('joueurs_historique', historique)

  // pnj_factions : table de jointure, on repart de zéro à chaque fois
  await supabase.from('pnj_factions').delete().neq('pnj_id', VIDE)
  if (pnjFactions.length) {
    const { error } = await supabase.from('pnj_factions').insert(pnjFactions)
    if (error) throw new Error(`pnj_factions : ${error.message}`)
  }

  // ── Phase 2 : FK circulaires ──
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

  // ── Meta : ligne unique ──
  const { error: errMeta } = await supabase.from('meta').update({
    nom: u.meta.nom, these: u.meta.these, date_campagne: u.meta.dateCampagne,
    saisons: u.meta.saisons, lignes_force: u.meta.lignesForce, arbitrages: u.meta.arbitrages,
  }).eq('id', true)
  if (errMeta) throw new Error(`meta : ${errMeta.message}`)
}

export async function tirerSupabase() {
  if (!supabase) throw new Error('Supabase non configuré (.env)')

  const [
    { data: factions, error: e1 },
    { data: pnjs, error: e2 },
    { data: pnjFactions, error: e3 },
    { data: lieux, error: e4 },
    { data: joueurs, error: e5 },
    { data: historique, error: e6 },
    { data: campagnes, error: e7 },
    { data: sessions, error: e8 },
    { data: scenes, error: e9 },
    { data: evenements, error: e10 },
    { data: rapports, error: e11 },
    { data: metaLignes, error: e12 },
  ] = await Promise.all([
    supabase.from('factions').select('*'),
    supabase.from('pnjs').select('*'),
    supabase.from('pnj_factions').select('*'),
    supabase.from('lieux').select('*'),
    supabase.from('joueurs').select('*'),
    supabase.from('joueurs_historique').select('*'),
    supabase.from('campagnes').select('*'),
    supabase.from('sessions').select('*').order('ordre'),
    supabase.from('session_scenes').select('*').order('ordre'),
    supabase.from('evenements').select('*'),
    supabase.from('rapports').select('*'),
    supabase.from('meta').select('*').eq('id', true).single(),
  ])
  const erreur = e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8 || e9 || e10 || e11 || e12
  if (erreur) throw new Error(erreur.message)
  if (!metaLignes) return null

  const facPourPnj = {}
  pnjFactions.forEach(pf => (facPourPnj[pf.pnj_id] ||= []).push(pf))

  const scenesParSession = {}
  scenes.forEach(sc => (scenesParSession[sc.session_id] ||= []).push(sc))

  const sessionsParCampagne = {}
  sessions.forEach(s => (sessionsParCampagne[s.campagne_id] ||= []).push(s))

  const histParJoueur = {}
  historique.forEach(h => (histParJoueur[h.joueur_id] ||= []).push(h))

  const univers = {
    meta: {
      nom: metaLignes.nom, version: 1, dateCampagne: metaLignes.date_campagne,
      these: metaLignes.these, saisons: metaLignes.saisons,
      lignesForce: metaLignes.lignes_force, arbitrages: metaLignes.arbitrages,
    },
    factions: factions.map(f => ({
      id: f.id, nom: f.nom, couleur: f.couleur, devise: f.devise, histoire: f.histoire,
      description: f.description, objectifs: f.objectifs, ressources: f.ressources,
      secrets: f.secrets, chefId: f.chef_id,
    })),
    pnjs: pnjs.map(p => {
      const liens = facPourPnj[p.id] || []
      return {
        id: p.id, nom: p.nom, role: p.role, poste: p.poste, superieurId: p.superieur_id,
        factionIds: liens.map(l => l.faction_id),
        rolesFactions: Object.fromEntries(liens.filter(l => l.role).map(l => [l.faction_id, l.role])),
        compteurs: p.compteurs || [], image: p.image, description: p.description,
        secrets: p.secrets, repliques: p.repliques || [], arbre: p.arbre,
      }
    }),
    lieux: lieux.map(l => ({
      id: l.id, nom: l.nom, type: l.type, factionId: l.faction_id, parentId: l.parent_id,
      description: l.description, secrets: l.secrets,
    })),
    joueurs: joueurs.map(j => ({
      id: j.id, joueur: j.joueur, personnage: j.personnage, classe: j.classe, niveau: j.niveau,
      faction: j.faction_id, superieurId: j.superieur_id, notes: j.notes, secrets: j.secrets,
      citations: j.citations || [], reputations: j.reputations || {},
      historique: (histParJoueur[j.id] || []).map(h => ({
        id: h.id, type: h.type, date: h.date, pnjId: h.pnj_id, lieuId: h.lieu_id,
        campagneId: h.campagne_id, sessionId: h.session_id, resume: h.resume, effet: h.effet,
      })),
    })),
    campagnes: campagnes.map(c => ({
      id: c.id, code: c.code, titre: c.titre, factionId: c.faction_id, saison: c.saison,
      pitch: c.pitch, ton: c.ton || '', duree: c.duree, niveaux: c.niveaux, issues: c.issues,
      pnjIds: c.pnj_ids || [], actes: c.actes || [],
      sessions: (sessionsParCampagne[c.id] || []).map(s => ({
        id: s.id, code: s.code, titre: s.titre, date: s.date, resume: s.resume,
        statut: s.statut, joueurIds: s.joueur_ids || [],
        sections: (scenesParSession[s.id] || []).map(sec => ({
          id: sec.id, titre: sec.titre, description: sec.description,
          notesMJ: sec.notes_mj, lieuId: sec.lieu_id,
        })),
      })),
    })),
    evenements: evenements.map(e => ({
      id: e.id, titre: e.titre, desc: e.desc_texte, debut: e.debut, fin: e.fin,
      participants: e.participants || [], joueurIds: e.joueur_ids || [], factionId: e.faction_id,
      lieuId: e.lieu_id, campagneId: e.campagne_id, sessionId: e.session_id,
      importance: e.importance, symbole: e.symbole,
    })),
    rapports: rapports.map(r => ({
      id: r.id, titre: r.titre, type: r.type, date: r.date, auteurId: r.auteur_id,
      factionId: r.faction_id, visibleJoueurs: r.visible_joueurs, contenu: r.contenu,
    })),
  }

  return normaliser(univers)
}
