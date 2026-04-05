# Email Creative Shopping List

Obiettivo: costruire una libreria visiva moderna, coerente e riutilizzabile per i journey email Bullwaves.

Nota pratica: per le email e' meglio usare immagini statiche leggere, con poco o zero testo incorporato, cosi' il copy resta HTML e il rendering mobile resta pulito.

## Direzione Consigliata

Mood principale: Human Trust + Product Proof

Mood secondario: Editorial Finance Premium

Mood da usare in modo selettivo: Performance Cinematic

## Specifiche Tecniche Suggerite

- Hero desktop: 1200x800 o 1400x900
- Crop email sicuro: area leggibile centrale, soggetto non troppo vicino ai bordi
- Peso target: sotto 250 KB quando possibile
- Formati: JPG per foto, PNG per asset con trasparenza, WebP solo se il vostro hosting finale lo supporta bene in email
- Testo dentro immagine: evitarlo quasi sempre
- Safe area logo: lasciare aria in alto e ai lati
- Palette: evitare colori urlati e look troppo da trading ad

## Asset Da Cercare Subito

### 1. Hero Principali

Servono 6 hero totali, 2 per mood.

#### Human Trust + Product Proof

- Persona reale con laptop in ambiente moderno e luminoso
- Composizione persona + interfaccia prodotto credibile

Parole chiave:
- real person using laptop modern interior fintech
- premium customer success portrait laptop natural light
- realistic fintech dashboard on laptop human scene

#### Editorial Finance Premium

- Workspace premium, pulito, luce naturale, dettagli business raffinati
- Portrait sobrio, professionale, non da stock tradizionale

Parole chiave:
- premium finance workspace minimal natural light
- elegant business portrait neutral tones editorial
- refined analyst desk laptop charts soft daylight

#### Performance Cinematic

- Scrivania moderna con glow da monitor e luce controllata
- Visual astratto ispirato a dati, velocita', movimento

Parole chiave:
- cinematic finance workstation realistic
- premium abstract data waves dark teal
- modern performance desk screen glow realistic

### 2. Support Visuals

Servono 9 support visual, 3 per mood.

#### Human Trust + Product Proof

- Mano sul trackpad con UI sullo schermo
- Crop di dashboard chiara e reale
- Persona in call o sessione di review operativa

#### Editorial Finance Premium

- Dettaglio notebook + report + penna
- Interno business elegante, minimal
- Close-up tastiera/schermo con luce naturale

#### Performance Cinematic

- Abstract motion lines premium
- Screen reflection con contrasto alto ma pulito
- Close-up interfaccia con profondita'

### 3. Product Crops

Servono 4 asset funzionali, non decorativi.

- Dashboard overview credibile
- Performance card o KPI card
- Trade or market insight panel
- Support or account manager style contact block

Questi possono arrivare anche da mockup o screenshot interni ripuliti, non solo da stock.

### 4. Trust Builders

Servono 4 asset leggeri di supporto.

- Headshot premium di account manager o support figure
- Interfaccia prodotto in contesto reale
- Ambiente di lavoro sobrio e professionale
- Texture o sfondo astratto soft da usare come separatore/section background

## Fonti Consigliate

Ordine consigliato:

1. Asset custom o AI art-directed, se volete una libreria coerente
2. Adobe Stock
3. Shutterstock
4. Freepik Premium
5. Unsplash o Pexels solo per concept rapidi, non come libreria finale principale

## Criteri Di Selezione

Tenere:

- soggetti reali
- luce naturale o studio molto controllato
- composizioni ariose
- look premium ma umano
- interfacce credibili

Scartare:

- trader che urlano o esultano
- grafici finti enormi sullo sfondo
- call center stock vecchio stile
- immagini troppo generiche da brochure corporate
- visual crypto-spam, neon eccessivo, soldi o razzi

## Pacchetto Minimo Per Partire

Se vogliamo partire veloci, questo e' il set minimo:

1. 2 hero Human Trust + Product Proof
2. 2 hero Editorial Finance Premium
3. 2 product crops reali o mockup
4. 2 support visuals con persone reali
5. 1 texture/sfondo soft

Totale: 9 asset

## Flusso Operativo Consigliato

1. Salvare qui i file locali in `assets/email-modernization/`
2. Compilare il manifest `assets/email-modernization/asset-manifest-template.csv`
3. Caricare gli asset sul vostro hosting o su SendGrid se decidete di usarlo come storage referenziabile
4. Incollare gli URL finali nel manifest
5. Riutilizzare gli URL nei template HTML

## Nomenclatura File

Formato consigliato:

`bw-[mood]-[slot]-[short-description]-v1.jpg`

Esempi:

- `bw-human-hero-laptop-review-v1.jpg`
- `bw-editorial-support-desk-report-v1.jpg`
- `bw-cinematic-hero-screen-glow-v1.jpg`
- `bw-product-kpi-card-v1.png`

## Nota Su SendGrid

SendGrid va bene per l'invio delle email, ma per gli asset immagine di solito e' piu' solido avere URL statici stabili e controllabili. Se avete un punto di hosting stabile con URL pubblici puliti, e' preferibile a improvvisare lo storage direttamente dentro il flusso email.