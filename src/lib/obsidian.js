import JSZip from 'jszip'
import { fmtDate } from './calendrier.js'

// Génère un vault-fragment Markdown, wikilinks compris, prêt à fusionner dans Obsidian.
const ascii = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim()

const lien = (nom) => `[[${nom}]]`

function mdPnj(p, factions) {
  const f = factions.find(x => x.id === p.faction)
  let md = `#PNJ\n\n# ${p.nom}\n\n**Rôle :** ${p.role || '?'} · **Faction :** ${f ? lien(f.nom) : 'aucune'}\n\n${p.description}\n`
  if (p.repliques?.length) md += `\n## Répliques\n${p.repliques.map(r => `> ${r}`).join('\n\n')}\n`
  if (p.compteurs?.length) {
    md += `\n## Compteurs\n\n${p.compteurs.map(c => `- **${c.nom}** (${c.min} à ${c.max}, valeur ${c.valeur ?? c.min}) : ${c.description}`).join('\n')}\n`
  }
  if (p.arbre) {
    md += `\n## Arbre narratif\n`
    md += `\n| Nœud | Type | Description |\n|---|---|---|\n`
    md += p.arbre.noeuds.map(n => `| ${n.titre} | ${n.type} | ${n.description.replace(/\n/g, ' ')} |`).join('\n') + '\n'
    if (p.arbre.transitions.length) {
      md += `\n**Transitions :** ${p.arbre.transitions.map(t => {
        const a = p.arbre.noeuds.find(n => n.id === t.from)?.titre
        const b = p.arbre.noeuds.find(n => n.id === t.to)?.titre
        return `${a} → ${b} (${t.label || 'sans condition'})`
      }).join(' · ')}\n`
    }
  }
  if (p.secrets) md += `\n## Secrets Maître\n\n${p.secrets}\n`
  return md
}

function mdFaction(f, pnjs) {
  const chefs = [pnjs.find(p => p.id === f.chefId)].filter(Boolean)
  let md = `#Faction\n\n# ${f.nom}\n\n`
  if (f.devise) md += `*« ${f.devise} »*\n\n`
  md += `${f.description}\n`
  if (chefs.length) md += `\n**Direction :** ${chefs.map(c => lien(c.nom)).join(' · ')}\n`
  if (f.objectifs) md += `\n## Objectifs\n\n${f.objectifs}\n`
  if (f.ressources) md += `\n## Ressources\n\n${f.ressources}\n`
  const membres = pnjs.filter(p => p.faction === f.id)
  if (membres.length) md += `\n## Membres notables\n\n${membres.map(m => `- ${lien(m.nom)} : ${m.role}`).join('\n')}\n`
  return md
}

function mdJoueur(j, factions, pnjs) {
  const f = factions.find(x => x.id === j.faction)
  let md = `#PJ\n\n# ${j.personnage}\n\n**Joueur :** ${j.joueur || '?'} · **Classe :** ${j.classe || '?'} niv. ${j.niveau} · **Faction :** ${f ? lien(f.nom) : 'libre'}\n\n${j.notes}\n`
  const reps = Object.entries(j.reputations || {}).filter(([, v]) => v !== 0)
  if (reps.length) {
    md += `\n## Réputations\n\n| Faction | Score |\n|---|---|\n`
    md += reps.map(([fid, v]) => `| ${factions.find(x => x.id === fid)?.nom || fid} | ${v > 0 ? '+' : ''}${v} |`).join('\n') + '\n'
  }
  if (j.citations?.filter(Boolean).length) {
    md += `\n## Citations\n\n${j.citations.filter(Boolean).map(c => `> ${c}`).join('\n\n')}\n`
  }
  if (j.historique?.length) {
    md += `\n## Historique\n\n`
    md += j.historique.map(i => {
      const p = pnjs.find(x => x.id === i.pnjId)
      return `- **${i.date != null ? fmtDate(i.date) : 'sans date'}** · *${i.type}*${p ? ` · ${lien(p.nom)}` : ''} : ${i.resume}${i.effet ? ` *(${i.effet})*` : ''}`
    }).join('\n') + '\n'
  }
  return md
}

function mdCampagne(c, factions, pnjs) {
  const f = factions.find(x => x.id === c.factionId)
  let md = `#Campagne\n\n# ${c.code ? c.code + ' : ' : ''}${c.titre}\n\n`
  md += `**Faction :** ${f ? lien(f.nom) : '?'} · **Saison :** ${c.saison} · **Départ :** ${c.depart} · **Durée :** ${c.duree || '?'} · **Niveaux :** ${c.niveaux || '?'}\n\n`
  if (c.ton) md += `**Ton :** ${c.ton}\n\n`
  md += `## Pitch\n\n${c.pitch}\n`
  if (c.actes?.length) {
    md += `\n## Actes\n\n`
    md += c.actes.map((a, i) => `### Acte ${i + 1} : ${a.titre}\n\n${a.resume}\n${a.pivot ? `\n**Point pivot :** ${a.pivot}\n` : ''}`).join('\n')
  }
  const perso = c.pnjIds.map(id => pnjs.find(p => p.id === id)).filter(Boolean)
  if (perso.length) md += `\n## PNJ clés\n\n${perso.map(p => lien(p.nom)).join(' · ')}\n`
  if (c.issues) md += `\n## Issues possibles\n\n${c.issues}\n`
  return md
}

function mdEvenements(evenements, pnjs, factions) {
  let md = `#Chronologie\n\n# Événements\n\n| Date | Événement | Participants | Faction |\n|---|---|---|---|\n`
  md += [...evenements].sort((a, b) => a.debut - b.debut).map(e => {
    const parts = e.participants.map(id => pnjs.find(p => p.id === id)?.nom).filter(Boolean).map(lien).join(', ')
    const f = factions.find(x => x.id === e.factionId)
    return `| ${fmtDate(e.debut)}${e.fin ? ` → ${fmtDate(e.fin)}` : ''} | **${e.titre}** ${e.desc ? ': ' + e.desc.replace(/\n/g, ' ') : ''} | ${parts} | ${f?.nom || ''} |`
  }).join('\n')
  return md + '\n'
}

export async function exporterObsidian(u) {
  const zip = new JSZip()
  const rac = zip.folder('Sideria Studio Export')
  const pnj = rac.folder('PNJ'), fac = rac.folder('Factions'), pj = rac.folder('PJ'), cmp = rac.folder('Campagnes')
  u.pnjs.forEach(p => pnj.file(`${ascii(p.nom) || p.id}.md`, mdPnj(p, u.factions)))
  u.factions.forEach(f => fac.file(`${ascii(f.nom) || f.id}.md`, mdFaction(f, u.pnjs)))
  u.joueurs.forEach(j => pj.file(`${ascii(j.personnage) || j.id}.md`, mdJoueur(j, u.factions, u.pnjs)))
  u.campagnes.forEach(c => cmp.file(`${ascii(c.titre) || c.id}.md`, mdCampagne(c, u.factions, u.pnjs)))
  if (u.rapports?.length) {
    const rap = rac.folder('Rapports')
    u.rapports.forEach(r => {
      const auteur = u.pnjs.find(p => p.id === r.auteurId)
      let md = `#Rapport\n\n# ${r.titre}\n\n*${r.type}*${auteur ? ` · par ${lien(auteur.nom)}` : ''}${r.date != null ? ` · ${fmtDate(r.date)}` : ''}${r.visibleJoueurs ? ' · visible joueurs' : ''}\n\n${r.contenu}\n`
      rap.file(`${ascii(r.titre) || r.id}.md`, md)
    })
  }
  rac.file('Chronologie des evenements.md', mdEvenements(u.evenements, u.pnjs, u.factions))
  rac.file('Meta-campagne.md', `#Meta\n\n# ${u.meta.nom}\n\n## Thèse\n\n${u.meta.these}\n\n## Saisons\n\n${u.meta.saisons.map(s => `### Saison ${s.num} : ${s.titre}\n\n*« ${s.question} »* · Horloge ${s.horloge} · Niveaux ${s.niveaux}\n`).join('\n')}`)
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'sideria_obsidian_export.zip'
  a.click()
  URL.revokeObjectURL(a.href)
}
