# Solitics Journey Brief: Unfunded Newcomers

Questo documento raccoglie la configurazione operativa gia definita nel progetto Bullwaves per implementare in Solitics il journey del segmento `Unfunded Newcomers`.

## Segmento

- Segment key interno: `new_unfunded`
- Label: `Unfunded Newcomers`
- Gruppo: `Acquisition`
- Priorita retention model: `16`
- Obiettivo: convertire rapidamente i nuovi account registrati in first-time depositors

## Regole di ingresso

Origine: logica retention locale in `ProfitableRanking.jsx`.

- `totalDeposit <= 0`
- `totalTrades <= 0`

Descrizione business:

- account appena registrato
- nessun deposito registrato
- nessun trade registrato

## Logica journey

Origine: `src/flows/unfundedNewcomersFlow.js`.

## Timeline completa

Questa e la timeline operativa completa del journey, espressa sia in giorni sia in ore.

### Tempo zero di riferimento

- `T0` = momento di ingresso del profilo nel segmento `new_unfunded`
- da questo istante partono i conteggi di `D0`, `D2`, `D5` e della finestra massima per conversione iniziale

### Sequenza standard completa

Caso standard: il profilo entra nel segmento, riceve tutti i touch principali, non converte subito e arriva al loop di re-entry.

| Fase | Timing nominale | Tempo da ingresso | Tempo da step precedente |
| --- | --- | --- | --- |
| Ingresso segmento | `T0` | `0 giorni / 0 ore` | — |
| Step 1: Welcome + Value | `D0` | `0 giorni / 0 ore` | `0 ore` |
| Step 2: Friction Reduction | `D2` | `2 giorni / 48 ore` | `2 giorni / 48 ore dopo Step 1` |
| Step 3: First Deposit Push | `D5` | `5 giorni / 120 ore` | `3 giorni / 72 ore dopo Step 2` |
| Finestra di conversione primaria | `entro D14` | `14 giorni / 336 ore` | `9 giorni / 216 ore dopo Step 3` |
| Follow-up recovery: Re-entry Nurture | `D21 after last non-converted step` | `26 giorni / 624 ore` nello scenario standard | `21 giorni / 504 ore dopo Step 3` |

### Regole temporali da implementare

- `D0` significa invio immediato all ingresso segmento: `0 minuti / 0 ore` di attesa.
- `D2` significa invio `48 ore` dopo lo Step 1.
- `D5` significa invio `72 ore` dopo lo Step 2, quindi `120 ore` dopo l ingresso segmento.
- `FTD +0d` significa invio immediato al verificarsi del primo deposito riuscito.
- `D21 after last non-converted step` significa invio `504 ore` dopo l ultimo touch del journey che non ha prodotto conversione.

### Nota importante sul re-entry D21

Il re-entry non e definito come `D21 dall ingresso`, ma come `D21 dall ultimo step non convertito`.

Nel path standard del flow locale questo significa:

- ultimo touch principale ricevuto = Step 3 a `D5`
- re-entry = `D5 + 21 giorni`
- quindi re-entry a `D26`, cioe `624 ore` dopo l ingresso segmento

Se invece in Solitics il profilo esce prima dal ramo principale o non riceve uno step successivo per logica di branching, il `D21` va ricalcolato sempre a partire dall ultimo messaggio effettivamente inviato e non convertito.

## Orchestrazione temporale dettagliata

Questa sezione traduce il flow in una logica eseguibile piu precisa.

### Fase 0: ingresso segmento

- trigger: il profilo entra in `new_unfunded`
- timestamp di riferimento da salvare: `segment_entry_at`
- attesa prima del primo invio: nessuna
- invio previsto: immediato

### Fase 1: Welcome + Value Proposition

- step key: `unfunded_newcomers_welcome_value_email`
- invio: a `T0`
- offset da ingresso: `0 giorni / 0 ore`
- offset dallo step precedente: non applicabile
- finestra di osservazione fino allo step successivo: `48 ore`

Durante queste `48 ore` va monitorato il primo decision checkpoint:

- `Visited deposit page?`
- segnali: click CTA deposito, apertura cashier, ingresso deposit page o evento equivalente

### Fase 2: Friction Reduction

- step key: `unfunded_newcomers_friction_reduction_email`
- invio: a `T0 + 48 ore`
- offset da ingresso: `2 giorni / 48 ore`
- offset da Step 1: `2 giorni / 48 ore`
- finestra di osservazione fino allo step successivo: `72 ore`

Durante queste `72 ore` va monitorato il secondo decision checkpoint:

- `Started deposit intent?`
- segnali: KYC completata, cashier aperto, metodo di pagamento selezionato, avanzamento funding flow

### Fase 3: First Deposit Push

- step key: `unfunded_newcomers_first_deposit_push_email`
- invio: a `T0 + 120 ore`
- offset da ingresso: `5 giorni / 120 ore`
- offset da Step 2: `3 giorni / 72 ore`
- finestra primaria di conversione residua fino a `D14`: `9 giorni / 216 ore`

Durante questa fase va monitorato il terzo decision checkpoint:

- `First deposit completed?`
- segnale: evento `successful deposit` o `FTD`
- finestra massima esplicitata nel flow: `entro 14 giorni dall ingresso`

### Fase 4A: ramo positivo

- condizione di attivazione: primo deposito riuscito
- step successivo: `unfunded_newcomers_first_trade_onboarding_email`
- timing: `FTD +0d`
- attesa: `0 ore` dal verificarsi dell FTD
- obiettivo: portare il profilo subito nel layer di activation al primo trade

### Fase 4B: ramo warm / non convertito

- condizione di attivazione: il profilo resta interessato o parzialmente engaged ma non converte
- step successivo: `unfunded_newcomers_reentry_nurture_email`
- timing: `21 giorni / 504 ore` dopo l ultimo touch non convertito
- nello scenario standard: `26 giorni / 624 ore` dall ingresso segmento

### Fase 4C: ramo cold drop-off

- condizione: assenza di segnali utili e mancata conversione
- azione consigliata: o chiusura del journey o ingresso nel medesimo re-entry path, in base alle regole che vuoi usare in Solitics
- se il cold drop-off deve ricevere il re-entry, il riferimento temporale resta comunque l ultimo step ricevuto e non convertito

### Step 1

- Step key: `unfunded_newcomers_welcome_value_email`
- Timing: `D0`
- Tempo da ingresso: `0 giorni / 0 ore`
- Tempo dal nodo precedente: `0 ore`
- Obiettivo: value framing iniziale su trust, accesso, velocita e funding come passo naturale

Decision checkpoint associato:

- domanda: ha visitato la pagina deposito?
- segnale operativo: click CRM o apertura cashier
- finestra consigliata di osservazione prima dello Step 2: `48 ore`

### Step 2

- Step key: `unfunded_newcomers_friction_reduction_email`
- Timing: `D2`
- Tempo da ingresso: `2 giorni / 48 ore`
- Tempo da Step 1: `2 giorni / 48 ore`
- Obiettivo: rimuovere attrito e chiarire dubbi su deposito, pagamenti, percorso e supporto

Decision checkpoint associato:

- domanda: ha mostrato intento di deposito?
- segnali operativi: KYC completata, cashier aperto, metodo di pagamento selezionato
- finestra consigliata di osservazione prima dello Step 3: `72 ore`

### Step 3

- Step key: `unfunded_newcomers_first_deposit_push_email`
- Timing: `D5`
- Tempo da ingresso: `5 giorni / 120 ore`
- Tempo da Step 2: `3 giorni / 72 ore`
- Obiettivo: spinta conversion-focused al primo deposito

Decision checkpoint associato:

- domanda: ha completato il primo deposito?
- finestra logica nel flow: entro `14 giorni` dall ingresso nel segmento
- tempo residuo standard tra Step 3 e fine finestra primaria `D14`: `9 giorni / 216 ore`

### Follow-up positivo

- Step key: `unfunded_newcomers_first_trade_onboarding_email`
- Timing: `FTD +0d`
- Trigger: immediatamente dopo primo deposito riuscito
- Tempo dal trigger: `0 giorni / 0 ore`
- Obiettivo: spostare il profilo dal funding all attivazione del primo trade

### Follow-up non convertito

- Step key: `unfunded_newcomers_reentry_nurture_email`
- Timing: `D21`
- Trigger: dopo ultimo step non convertito
- Tempo dal trigger: `21 giorni / 504 ore`
- Tempo dall ingresso nel caso standard completo: `26 giorni / 624 ore`
- Obiettivo: riaprire il percorso con un angolo piu leggero e piu chiaro

## KPI del journey

Origine: `src/flows/unfundedNewcomersFlow.js`.

- `FTD conversion`
- `Time to first deposit`
- `First-trade activation`

## Outcome logici del flow

- `FTD converted`
- `Warm but not converted`
- `Cold drop-off`

## Trigger ed exit consigliati in Solitics

Questi punti riflettono il flow locale e possono essere tradotti nella logica Solitics con i nomi evento disponibili nel workspace dati.

### Entry

- entra quando il profilo soddisfa il segmento `new_unfunded`
- cioe nessun deposito e nessun trade
- salva il timestamp di ingresso journey per calcolare correttamente `D0`, `D2`, `D5` e la finestra `D14`

### Exit immediata

- esci dal journey se avviene il primo deposito riuscito
- esci dal journey se il profilo non e piu `new_unfunded`
- se usi il ramo `FTD +0d`, l exit dal ramo principale e contestuale al trigger di conversione

### Routing decisionale suggerito

- `Visited deposit page`: usa click su CTA deposito, apertura cashier o evento equivalente
- `Started deposit intent`: usa KYC completata, selezione payment method o cashier progress event
- `First deposit completed`: usa evento FTD/successful deposit

### Attese tra uno step e l altro da impostare in Solitics

- Entry -> Step 1: `0 ore`
- Step 1 -> Step 2: `48 ore`
- Step 2 -> Step 3: `72 ore`
- Step 3 -> Re-entry: `504 ore` solo se non c e conversione e il profilo resta eleggibile al recovery
- FTD event -> First Trade Onboarding: `0 ore`

### Finestra massima della conversione primaria

- il flow locale esplicita la misura `Deposit completed within 14 days from entry`
- quindi la finestra primaria da monitorare per la conversione principale e `D0 -> D14`
- in ore: `0 -> 336 ore` dall ingresso nel segmento

## Mapping template SendGrid

Origine: `src/pages/Retention/sendgridTemplateRegistry.js`.

## Campi da compilare nella console Solitics

Questa sezione serve per quando apri il template dal journey in Solitics e, nella colonna sinistra, devi inserire o controllare campi come nome template, subject, placeholders e link.

### Regola pratica

Per ogni template Unfunded Newcomers, nella console Solitics considera sempre questi blocchi informativi:

- `Template name`
- `Subject`
- `Placeholders da dichiarare`
- `Link presenti nel template`

### Placeholder da dichiarare per ora

Questi sono i placeholder che vanno considerati utili e presenti nel template renderizzato:

- `first_name`
- `cta_url`
- `unsubscribe`
- `unsubscribe_preferences`

### Placeholder da NON includere per ora

Come richiesto, per adesso non includere placeholder come questo:

- `{{#if account_manager_name}}{{account_manager_name}}{{else}}Il team Bullwaves{{/if}}`

Quindi:

- non mappare `account_manager_name`
- non trattarlo come placeholder richiesto in console

### Placeholder presenti nei test data ma non necessari come input operativo

Nel codice esiste anche `support_url` nei test data, ma nei template Unfunded Newcomers il supporto WhatsApp e gia incorporato come link contestuale dentro l HTML.

Quindi, per il setup Solitics:

- non e necessario dichiarare `support_url` come placeholder obbligatorio
- il support link e gia hardcoded nel template renderizzato

## Link presenti nei template

Origine: `segmentJourneyTemplateBuilder.js`, `emailJourneyIconRegistry.js` e HTML SendGrid generato.

### Link comuni presenti in tutti i template Unfunded Newcomers

Questi link sono presenti in tutti i template del segmento, indipendentemente da locale o variante.

#### 1. Primary CTA

- tipo: placeholder dinamico
- link: `{{cta_url}}`
- uso: bottone principale del template

#### 2. Footer unsubscribe

- tipo: placeholder dinamico
- link: `{{{unsubscribe}}}`
- uso: link footer di disiscrizione

#### 3. Footer unsubscribe preferences

- tipo: placeholder dinamico
- link: `{{{unsubscribe_preferences}}}`
- uso: link footer preferenze disiscrizione

#### 4. Secondary support CTA

- tipo: link statico contestuale gia renderizzato nel template
- base link: `https://wa.me/35799514794?...`
- uso: link secondario di supporto WhatsApp
- nota: il testo WhatsApp cambia in base a lingua e template, perche incorpora il contesto della mail

### Regole link delle icone nei box

Le icone dei tre box centrali non usano placeholder. I link vengono assegnati in automatico in base al tipo di icona.

#### Regola 1. Icona supporto

- destinazione: WhatsApp contestuale
- base: `https://wa.me/35799514794?...`

#### Regola 2. Icona deposito

- destinazione: pagina deposito
- link: `https://my.bullwaves.global/deposit`

#### Regola 3. Tutte le altre icone

- destinazione: login portal
- link: `https://portal.bullwaves.com/login`

## Inventario operativo per template

Questa sezione e pensata esattamente per la colonna sinistra della console Solitics.

Per ogni template trovi:

- nome template
- subject
- placeholders da dichiarare
- link da sapere che sono presenti nel template

### Convenzione placeholder per tutti i template Unfunded Newcomers

Per tutti i template qui sotto, salvo diversa indicazione, i placeholder da dichiarare sono:

- `first_name`
- `cta_url`
- `unsubscribe`
- `unsubscribe_preferences`

Non includere:

- `account_manager_name`
- `support_url`

### Convenzione link per tutti i template Unfunded Newcomers

Per tutti i template qui sotto, salvo diversa indicazione, sono presenti:

- CTA principale: `{{cta_url}}`
- Link supporto secondario: `https://wa.me/35799514794?...`
- Footer unsubscribe: `{{{unsubscribe}}}`
- Footer unsubscribe preferences: `{{{unsubscribe_preferences}}}`

## Dettaglio link per step e variante

### 1. Welcome + Value Proposition

#### EN A

- Template name: `Unfunded Newcomers - Welcome + Value Proposition A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Your Bullwaves account is ready. Funding it takes just one step.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://my.bullwaves.global/deposit`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### EN B

- Template name: `Unfunded Newcomers - Welcome + Value Proposition B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Your registration is done. Unlock the next step on Bullwaves.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://my.bullwaves.global/deposit`
	- Box 3 icon link: `https://portal.bullwaves.com/login`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT A

- Template name: `Unfunded Newcomers - Welcome + Proposta di Valore A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Il tuo account Bullwaves e pronto. Ti manca solo un passo.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://my.bullwaves.global/deposit`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT B

- Template name: `Unfunded Newcomers - Welcome + Proposta di Valore B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Registrazione completata. Sblocca il prossimo passaggio su Bullwaves.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://my.bullwaves.global/deposit`
	- Box 3 icon link: `https://portal.bullwaves.com/login`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

### 2. Friction Reduction

#### EN A

- Template name: `Unfunded Newcomers - Friction Reduction A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Questions before funding? Here is the fastest way forward.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://my.bullwaves.global/deposit`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### EN B

- Template name: `Unfunded Newcomers - Friction Reduction B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Still hesitating? The deposit step may be simpler than you think.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://my.bullwaves.global/deposit`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT A

- Template name: `Unfunded Newcomers - Riduzione Attriti A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Hai dubbi prima di depositare? Ecco il modo più semplice per procedere.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://my.bullwaves.global/deposit`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT B

- Template name: `Unfunded Newcomers - Riduzione Attriti B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Sei ancora indeciso? Il deposito potrebbe essere più semplice di quanto pensi.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://my.bullwaves.global/deposit`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

### 3. First Deposit Push

#### EN A

- Template name: `Unfunded Newcomers - First Deposit Push A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Your Bullwaves access is almost unlocked. Complete your first deposit now.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### EN B

- Template name: `Unfunded Newcomers - First Deposit Push B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Do not lose momentum. Finish the funding step today.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT A

- Template name: `Unfunded Newcomers - Primo Deposito A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Il tuo accesso Bullwaves e quasi sbloccato. Completa ora il primo deposito.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT B

- Template name: `Unfunded Newcomers - Primo Deposito B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Non perdere slancio. Completa oggi il deposito del tuo account.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

### 4. First Trade Onboarding

#### EN A

- Template name: `Unfunded Newcomers - First Trade Onboarding A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Your account is funded. Now make your first move.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://portal.bullwaves.com/login`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### EN B

- Template name: `Unfunded Newcomers - First Trade Onboarding B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Your first trade does not need to be complicated.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://portal.bullwaves.com/login`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT A

- Template name: `Unfunded Newcomers - Onboarding Primo Trade A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Il tuo account è finanziato. Ora fai il tuo primo passo.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://portal.bullwaves.com/login`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT B

- Template name: `Unfunded Newcomers - Onboarding Primo Trade B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}La tua prima operazione non deve essere complicata.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://portal.bullwaves.com/login`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

### 5. Re-entry Nurture

#### EN A

- Template name: `Unfunded Newcomers - Re-entry Nurture A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Still considering Bullwaves? Let us make the next step easier.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### EN B

- Template name: `Unfunded Newcomers - Re-entry Nurture B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Your opportunity is still open. Re-enter with a clearer path.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT A

- Template name: `Unfunded Newcomers - Riattivazione Soft A`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}Stai ancora valutando Bullwaves? Rendiamo il prossimo passo più semplice.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

#### IT B

- Template name: `Unfunded Newcomers - Riattivazione Soft B`
- Subject: `{{#if first_name}}{{first_name}}, {{/if}}La tua opportunità è ancora aperta. Rientra con un percorso più chiaro.`
- Placeholders da dichiarare: `first_name`, `cta_url`, `unsubscribe`, `unsubscribe_preferences`
- Link presenti:
	- CTA principale: `{{cta_url}}`
	- Box 1 icon link: `https://portal.bullwaves.com/login`
	- Box 2 icon link: `https://portal.bullwaves.com/login`
	- Box 3 icon link: `https://wa.me/35799514794?...`
	- Support CTA secondaria: `https://wa.me/35799514794?...`
	- Footer: `{{{unsubscribe}}}`, `{{{unsubscribe_preferences}}}`

### 1. Welcome + Value Proposition

Local template id: `unfunded_newcomers_welcome_value_email`

| Locale | Variante | Template ID | Version ID | Timing |
| --- | --- | --- | --- | --- |
| EN | A | `d-6dbc11007c244c8ab87e2d4d8fa015e4` | `8f3f5fac-a2d8-4042-90e1-08b7fa82e8bb` | `D0` |
| EN | B | `d-26cf50cb8d944f58ae436eb14a13d687` | `756f8692-e74b-4452-af58-9b6eb32e1bb1` | `D0` |
| IT | A | `d-48d554bff2534e92a62f33b936cd51ce` | `d6e95aeb-f3b0-4b51-9720-bb53c74461aa` | `D0` |
| IT | B | `d-260c34d7c84c4ef280ee7dfd8538bf99` | `6259cffa-0173-4176-a40f-6f1ccc1f05a5` | `D0` |

### 2. Friction Reduction

Local template id: `unfunded_newcomers_friction_reduction_email`

| Locale | Variante | Template ID | Version ID | Timing |
| --- | --- | --- | --- | --- |
| EN | A | `d-070656e9654c4cda8b3388c4840c1a6e` | `7d929f01-6cf0-42be-989c-dd368e5e67e5` | `D2` |
| EN | B | `d-7e2d3e8aa47b45dbbc161d0e2d5cf044` | `7b381c67-9b72-4193-8f88-935b07931072` | `D2` |
| IT | A | `d-4bd5fd578c7f4d6f933da6670c20e8b6` | `df257034-2601-4f6e-8d62-7f67addf055c` | `D2` |
| IT | B | `d-1f46366f7120412dab51635e793f5827` | `2f0e6d0c-c3c8-465b-9354-97d8423c16a4` | `D2` |

### 3. First Deposit Push

Local template id: `unfunded_newcomers_first_deposit_push_email`

| Locale | Variante | Template ID | Version ID | Timing |
| --- | --- | --- | --- | --- |
| EN | A | `d-92da8490d8264618be2e00775aec4629` | `4d6a8306-2269-4ee4-a2e5-b42f24b0e036` | `D5` |
| EN | B | `d-7b47f5e61780443799ee40a531568b38` | `ece7d409-5b24-42b4-a2b5-5d003de3a822` | `D5` |
| IT | A | `d-c010b6bf217b4177b61707a8c557cbee` | `05cf59b6-9cc9-4783-a550-a9faa3305626` | `D5` |
| IT | B | `d-0fe9ba896386456b95b5c53b76a88268` | `2d89beee-9287-47c1-8237-58c62f0be736` | `D5` |

### 4. First Trade Onboarding

Local template id: `unfunded_newcomers_first_trade_onboarding_email`

| Locale | Variante | Template ID | Version ID | Timing |
| --- | --- | --- | --- | --- |
| EN | A | `d-192758b6508240d89507053f69f9ca9b` | `567f50be-6dd8-4120-a7d4-87ed1ab67417` | `FTD +0d` |
| EN | B | `d-33fe70fd80864e70b6eae74a4553fa07` | `65c51c8e-41ca-4f32-8ba0-2d93b79ba0fb` | `FTD +0d` |
| IT | A | `d-662382ac8cc146fa9f3f7fc67a0b77df` | `b2122d15-7135-4cf9-b5cb-77b887b5bd77` | `FTD +0d` |
| IT | B | `d-b9dc4454a1e1468988bf4e3e3ce336b1` | `f998b653-f80b-48a8-afd3-fc4e7643926c` | `FTD +0d` |

### 5. Re-entry Nurture

Local template id: `unfunded_newcomers_reentry_nurture_email`

| Locale | Variante | Template ID | Version ID | Timing |
| --- | --- | --- | --- | --- |
| EN | A | `d-16dec51da32a4f82827b8992b253f193` | `cf39ee05-5e3d-4117-892f-02ff01c33735` | `D21` |
| EN | B | `d-3d042316676145358bf4ab756802e645` | `492adbf6-da7b-4b4e-8728-6bcd15a6be43` | `D21` |
| IT | A | `d-6e3163dc104c4c0a93199ff9d4b2fdf7` | `276a02fb-2a34-490a-892d-b825866784bf` | `D21` |
| IT | B | `d-ba0178bae6f342038ad4f550dc06a1ef` | `580994e6-a223-431b-9029-c21ffa6a4879` | `D21` |

## SMS companion copy disponibile

Origine: `src/pages/Retention/segmentJourneyTemplateExtras.js`.

Per ciascuno dei 5 step esistono gia copy SMS EN/IT variante A/B, con gli stessi timing del journey email. Se in Solitics vuoi attivare anche SMS, puoi usare direttamente quei testi come companion layer dello stesso step.

## Ordine minimo di implementazione in Solitics

1. Crea il segmento di ingresso `new_unfunded` con regola `totalDeposit <= 0` e `totalTrades <= 0`.
2. Imposta lo Step 1 con invio immediato `0 ore` dopo l ingresso.
3. Imposta lo Step 2 con wait di `48 ore` dopo lo Step 1.
4. Imposta lo Step 3 con wait di `72 ore` dopo lo Step 2.
5. Definisci l exit immediata su evento `first deposit successful` in qualsiasi punto del ramo principale.
6. Collega il post-conversion step `FTD +0d` al primo deposito riuscito con wait `0 ore`.
7. Collega il recovery step `D21` ai profili ancora non convertiti con wait di `504 ore` dall ultimo touch non convertito.
8. Monitora la finestra primaria di conversione fino a `D14`, cioe `336 ore` dall ingresso.
9. Applica split per `locale` e `variant` coerente con la tua logica A/B in Solitics.

## Riferimenti interni

- Flow journey: `src/flows/unfundedNewcomersFlow.js`
- Regole segmento: `src/pages/Retention/ProfitableRanking.jsx`
- Template email: `src/pages/Retention/segmentJourneyTemplates.js`
- Template extras SMS: `src/pages/Retention/segmentJourneyTemplateExtras.js`
- Registry SendGrid: `src/pages/Retention/sendgridTemplateRegistry.js`