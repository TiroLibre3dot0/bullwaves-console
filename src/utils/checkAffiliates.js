// Script per controllare la corrispondenza tra ID affiliati e nomi
// Carica i dati da Payments Report e Media Report e confronta

import Papa from 'papaparse'

async function checkAffiliateMappings() {
  console.log('🔍 Controllo corrispondenze ID Affiliati vs Nomi...\n')

  const results = {
    payments: {},
    media: {},
    conflicts: [],
    uniqueIds: new Set()
  }

  try {
    // Carica Payments Report
    console.log('📊 Caricamento Payments Report...')
    const paymentsRes = await fetch('/Payments Report.csv')
    if (paymentsRes.ok) {
      const paymentsText = await paymentsRes.text()
      const { data: paymentsData, errors: paymentsErrors } = Papa.parse(paymentsText, {
        header: true, skipEmptyLines: true, dynamicTyping: true
      })

      if (paymentsErrors && paymentsErrors.length) {
        console.error('❌ Errore parsing Payments Report:', paymentsErrors[0].message)
      } else {
        console.log(`✅ Payments Report: ${paymentsData.length} righe caricate`)

        for (const row of paymentsData) {
          const affiliateId = row['Affiliate ID'] || row['AffiliateID'] || row['ID'] || row['UID']
          const affiliateName = row['Affiliate'] || row['Affiliate Name'] || row['Name'] || ''

          if (affiliateId) {
            const idStr = String(affiliateId).trim()
            results.uniqueIds.add(idStr)

            if (!results.payments[idStr]) {
              results.payments[idStr] = new Set()
            }
            if (affiliateName) {
              results.payments[idStr].add(affiliateName.trim())
            }
          }
        }
      }
    } else {
      console.log('⚠️  Payments Report non disponibile')
    }

    // Carica Media Report
    console.log('📺 Caricamento Media Report...')
    const mediaRes = await fetch('/Media Report.csv')
    if (mediaRes.ok) {
      const mediaText = await mediaRes.text()
      const { data: mediaData, errors: mediaErrors } = Papa.parse(mediaText, {
        header: true, skipEmptyLines: true, dynamicTyping: true
      })

      if (mediaErrors && mediaErrors.length) {
        console.error('❌ Errore parsing Media Report:', mediaErrors[0].message)
      } else {
        console.log(`✅ Media Report: ${mediaData.length} righe caricate`)

        for (const row of mediaData) {
          const affiliateId = row['UID'] || row['Affiliate ID'] || row['AffiliateID'] || row['ID']
          const affiliateName = row['Affiliate'] || row['Affiliate Name'] || row['Name'] || ''

          if (affiliateId) {
            const idStr = String(affiliateId).trim()
            results.uniqueIds.add(idStr)

            if (!results.media[idStr]) {
              results.media[idStr] = new Set()
            }
            if (affiliateName) {
              results.media[idStr].add(affiliateName.trim())
            }
          }
        }
      }
    } else {
      console.log('⚠️  Media Report non disponibile')
    }

    // Analizza i risultati
    console.log(`\n📈 Risultati:`)
    console.log(`   ID unici trovati: ${results.uniqueIds.size}`)

    // Trova conflitti (stessi ID con nomi diversi)
    for (const id of results.uniqueIds) {
      const paymentsNames = results.payments[id] || new Set()
      const mediaNames = results.media[id] || new Set()
      const allNames = new Set([...paymentsNames, ...mediaNames])

      if (allNames.size > 1) {
        results.conflicts.push({
          id,
          payments: Array.from(paymentsNames),
          media: Array.from(mediaNames),
          allNames: Array.from(allNames)
        })
      }
    }

    // Mostra statistiche
    console.log(`   Conflitti trovati: ${results.conflicts.length}`)

    // Mostra esempio specifico richiesto (ID 2287)
    const exampleId = '2287'
    if (results.uniqueIds.has(exampleId)) {
      console.log(`\n🎯 Esempio ID ${exampleId}:`)
      console.log(`   Payments: ${Array.from(results.payments[exampleId] || []).join(', ') || 'N/A'}`)
      console.log(`   Media: ${Array.from(results.media[exampleId] || []).join(', ') || 'N/A'}`)
    } else {
      console.log(`\n❌ ID ${exampleId} non trovato in nessun report`)
    }

    // Mostra alcuni conflitti
    if (results.conflicts.length > 0) {
      console.log(`\n⚠️  Primi 5 conflitti trovati:`)
      results.conflicts.slice(0, 5).forEach(conflict => {
        console.log(`   ID ${conflict.id}: ${conflict.allNames.join(' | ')}`)
      })
    }

    // Mostra distribuzione
    const paymentsOnly = Object.keys(results.payments).filter(id => !results.media[id])
    const mediaOnly = Object.keys(results.media).filter(id => !results.payments[id])
    const both = Object.keys(results.payments).filter(id => results.media[id])

    console.log(`\n📊 Distribuzione:`)
    console.log(`   Solo in Payments: ${paymentsOnly.length}`)
    console.log(`   Solo in Media: ${mediaOnly.length}`)
    console.log(`   In entrambi: ${both.length}`)

    return results

  } catch (error) {
    console.error('❌ Errore durante il controllo:', error)
    return null
  }
}

// Esporta per uso in console del browser
window.checkAffiliateMappings = checkAffiliateMappings

console.log('💡 Script caricato! Esegui checkAffiliateMappings() nella console per avviare il controllo.')