/**
 * Utility per gestire dinamicamente i meta tags Open Graph
 * Usato per le preview di link condivisi (Slack, WhatsApp, Teams, etc)
 */

export function setOpenGraphMeta(config) {
  const {
    title = 'Bullwaves — Weekly Map',
    description = 'Weekly execution contract, team commitments and project governance',
    image = '/og-image-weekly-map.png',
    url = typeof window !== 'undefined' ? window.location.href : '',
  } = config

  // Funzione helper per aggiungere/aggiornare meta tag
  const setMetaTag = (property, content) => {
    let tag = document.querySelector(`meta[property="${property}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('property', property)
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', content)
  }

  // Funzione helper per aggiungere/aggiornare meta tag name
  const setMetaTagByName = (name, content) => {
    let tag = document.querySelector(`meta[name="${name}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', name)
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', content)
  }

  // Open Graph tags (per Slack, Discord, WhatsApp, etc)
  setMetaTag('og:title', title)
  setMetaTag('og:description', description)
  setMetaTag('og:image', image)
  setMetaTag('og:url', url)
  setMetaTag('og:type', 'website')
  setMetaTag('og:site_name', 'Bullwaves')

  // Twitter Card tags (X/Twitter)
  setMetaTagByName('twitter:card', 'summary_large_image')
  setMetaTagByName('twitter:title', title)
  setMetaTagByName('twitter:description', description)
  setMetaTagByName('twitter:image', image)

  // Page title
  document.title = title
}

export function resetOpenGraphMeta() {
  document.title = 'Bullwaves — Dashboard'
}
