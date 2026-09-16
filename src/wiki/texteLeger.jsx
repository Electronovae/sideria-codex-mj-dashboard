import React from 'react'

// Version indépendante du petit renderer markdown du Studio (communs.jsx) : gère seulement
// **gras** et *italique*, suffisant pour le texte des features. Volontairement séparée pour
// ne pas faire dépendre le bundle public du wiki de tout App.jsx (Studio) via communs.jsx.
export function TexteLeger({ children }) {
  if (!children) return null
  const parts = String(children).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
        if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}
