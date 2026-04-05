# Bullwaves Email Master Template

Obiettivo: definire un solo template master modulare, con due skin visive controllate.

- Skin 1: `core-light`
- Skin 2: `core-dark`

Questo template master deve diventare la base per i journey email Bullwaves. Le hero cambiano poco e restano in una libreria stabile; il contenuto che varia e' nei blocchi testuali e nei proof block.

## Principi

1. Un solo layout strutturale
2. Due sole skin visive
3. Hero senza testo incorporato
4. Copy, logo e CTA sempre in HTML
5. Una CTA primaria chiara
6. Moduli riutilizzabili e facili da localizzare

## Struttura Master

### 1. Brand Bar

Contenuto:
- logo Bullwaves
- eventuale micro-label di contesto, per esempio `Bullwaves Journey`
- mini brand line o descriptor leggibile

Funzione:
- aprire l'email con un segnale brand chiaro e premium

Regole:
- il logo deve essere immediatamente riconoscibile
- dimensione visiva sufficiente, non simbolica
- molto respiro
- nessun rumore visivo
- logo sempre fuori dalla hero immagine

### 2. Hero Header

Contenuto:
- eyebrow
- headline principale
- subheadline breve
- hero image
- CTA primaria

Funzione:
- impostare tono e beneficio in pochi secondi

Regole:
- headline massimo 2 righe
- subheadline massimo 2 o 3 righe
- hero pulita, senza testo dentro immagine
- CTA visibile subito

### 3. Quick Value Block

Contenuto:
- 3 value point o 3 next steps

Funzione:
- dare orientamento rapido e scansionabile

Regole:
- punti corti
- ogni punto deve contenere un beneficio o una micro-azione

### 4. Proof Block

Contenuto possibile:
- mini dashboard crop
- KPI card
- benefit panel
- account insight

Funzione:
- aumentare credibilita' e concretezza

Regole:
- massimo un'idea per blocco
- niente collage caotici

### 5. Support Block

Contenuto:
- supporto umano, account manager, help CTA secondaria

Funzione:
- ridurre attrito e aumentare fiducia

Regole:
- sempre secondario alla CTA primaria
- tono rassicurante, mai invasivo

### 6. Footer

Contenuto:
- disclaimers essenziali
- support link
- eventuale note di compliance
- logo brand ripetuto anche nel footer
- link unsubscribe e preferences sempre visibili

Funzione:
- chiudere in modo pulito e coerente

Regole:
- strutturare company info e risk disclaimer in blocchi distinti
- il footer non deve sembrare un dump legale casuale
- alta leggibilità anche su mobile
- nessun muro di testo se non strettamente necessario

## Skin Light

Nome: `core-light`

Uso consigliato:
- welcome
- onboarding
- activation
- segmenti freddi

Caratteristiche:
- background chiaro caldo
- card bianca o latte molto pulita
- testo antracite/slate
- accenti navy, blue-gray o teal controllato
- sensazione editoriale, premium, rassicurante

## Skin Dark

Nome: `core-dark`

Uso consigliato:
- re-engagement
- reminder ad alta intenzione
- segmenti attivi o piu' sofisticati

Caratteristiche:
- background navy/carbone
- pannelli interni piu' chiari ma sempre scuri
- testo avorio o quasi bianco
- accenti blue-electric molto controllati
- sensazione moderna, focalizzata, high intent

## Hero Library Iniziale

Set minimo consigliato:

1. `hero-light-human-01`
2. `hero-light-product-01`
3. `hero-dark-human-01`
4. `hero-dark-product-01`

Regola:
- queste hero non cambiano ad ogni email
- vengono assegnate ai journey o ai cluster di messaggi

## Cosa Cambia Tra Una Email E L'altra

Può cambiare:
- eyebrow
- headline
- subheadline
- proof block
- value points
- CTA label
- CTA destination
- support copy

Non dovrebbe cambiare spesso:
- struttura master
- spacing generale
- font hierarchy
- hero system
- footer logic

## Regole Di Modernita'

- piu' aria tra i blocchi
- meno cornici inutili
- piu' gerarchia tipografica
- piu' contrasto tra titolo, corpo e action
- niente testo dentro hero
- niente feel da newsletter vecchia scuola

## Regole Email-Safe

- 600 px circa di area contenuto principale
- font web-safe o fallback solidi
- CSS semplice e robusto
- immagini ottimizzate
- CTA come bottone HTML vero
- logo sempre fuori dalla hero immagine

## Percorso Di Adozione

1. Approvare la struttura master
2. Approvare light e dark
3. Selezionare 4 hero stabili
4. Mappare ogni journey a una skin e a una hero
5. Riscrivere i contenuti dentro il sistema, non fuori dal sistema