# Bot / EA activity — report completo (since 2024-01-01)

**Data di generazione:** 2026-01-12  
**Fonte dati:** `Bullwaves_new/public/Registrations Report.csv`  
**Metodo di calcolo:** `Bullwaves_new/scripts/board_bot_analysis.js`  
**Output numerico (JSON):** `Bullwaves_new/scripts/board_bot_analysis.output.json`

---

## 1) Executive snapshot (numeri chiave)

**Perimetro (registrati dal 01/01/2024):**
- Utenti in scope: **79,369**
- Utenti con almeno un trade (Position Count > 0): **26,094**

**Definizione “Aggressivi” (bot/EA-like) basata su soglia statistica:**
- Calcoliamo i percentili sul solo sottoinsieme “traded users” (Position Count > 0)
- **p95** Position Count = **804**
- **p99** Position Count = **2,121.21** (cutoff “Aggressivi”, top 1%)

**Normal vs Aggressive (traded users):**
- Normal (Position Count < p99): **25,833 users**
- Aggressive (Position Count ≥ p99): **261 users** (≈ **1.0%** dei traded)
- Gli Aggressive generano **~19.1%** di tutte le posizioni (tra i traded users)

**Impatto economico (Economic result / Net PL) — regola segno (come richiesto):**
- **Valore > 0** ⇒ **profitti Bullwaves**
- **Valore < 0** ⇒ **profitti del trader**

---

## 2) Terminologia e metriche (per evitare ambiguità)

### 2.1 Position Count
- È il conteggio totale posizioni/trade per utente (nel report “Registrations Report.csv”).
- È un indicatore pragmatico di “intensità operativa” (più posizioni ⇒ più probabile automazione/EA, ma non è una prova).

### 2.2 Economic result (Bullwaves) = Net PL
Questo report usa il campo **Net PL** come metrica economica aggregabile:
- **Positivo** ⇒ Bullwaves guadagna
- **Negativo** ⇒ il trader guadagna

Nel report trovi:
- **Avg economic result (Bullwaves)**: media per utente nel gruppo
- **Total economic result**: somma sul gruppo (impatto aggregato)
- **Users where Bullwaves gains / trader gains**: conteggi utenti con Net PL > 0 o < 0
  - Nota: utenti con Net PL = 0 non rientrano in nessuno dei due conteggi

---

## 3) Metodo di segmentazione (Normal vs Aggressive)

### 3.1 Perché usare p99
- Definizione difendibile e non arbitraria: “Aggressive” = top 1% per Position Count tra chi ha tradato.
- Riduce il rischio di “tagliare” a mano una soglia discutibile (es. 1000 posizioni), soprattutto quando la distribuzione è molto asimmetrica.

### 3.2 Threshold finali
- **p95** = 804
- **p99** = 2,121.21
- **Aggressive threshold** = p99

---

## 4) Risultati: Normal vs Aggressive

> Tutti i numeri qui sotto sono calcolati su utenti registrati dal **01/01/2024**.

### 4.1 Normal (Position Count < p99)
- Utenti: **25,833**
- Position Count:
  - Media: **163.29**
  - Mediana: **58**
  - Somma posizioni: **4,218,316**
- Economic result (Bullwaves / Net PL):
  - Media per utente: **€639.08**
  - Totale: **€16,509,338**
  - Utenti con Bullwaves gains (>0): **20,535**
  - Utenti con trader gains (<0): **5,167**
- Net Deposits:
  - Media per utente: **€1,048.23**

### 4.2 Aggressive (Position Count ≥ p99)
- Utenti: **261**
- Incidenza:
  - ~**1.000%** dei traded users
  - ~**0.329%** di tutti gli utenti in scope
- Position Count:
  - Media: **3,806.59**
  - Mediana: **2,941**
  - Somma posizioni: **993,521**
  - Quota posizioni sul totale traded: **19.0628%**
- Economic result (Bullwaves / Net PL):
  - Media per utente: **€10,806.90**
  - Totale: **€2,820,601**
  - Utenti con Bullwaves gains (>0): **222**
  - Utenti con trader gains (<0): **38**
- Net Deposits:
  - Media per utente: **€12,416.72**

### 4.3 Lettura “operativa” dei risultati
- La top-1% “Aggressive” pesa in modo sproporzionato sulle posizioni (**~19%**) ⇒ indicatore forte di automazione o comportamenti sistematici.
- Il gruppo Aggressive è **mediamente molto più “deposit-heavy”** (≈ €12.4k vs €1.0k) e con risultato economico medio molto più alto.

---

## 5) Concentrazione per Affiliate (Aggressive users)

### 5.1 Note importanti sul mapping nomi affiliati
- Il mapping `affiliate_id -> affiliate name` è costruito da:
  - `Bullwaves_new/public/Payments Report.csv` (affiliate_id + affiliate)
  - `Bullwaves_new/public/commissions.csv` (Affiliate Id + Affiliate)
- Se un `affiliate_id` non esiste in quei file, il nome risulta **(unknown)**.

### 5.2 Top 10 affiliate per # Aggressive users

| Affiliate ID | Affiliate name | Aggressive users | Avg positions | Avg Net Deposits | Avg economic result (Bullwaves) |
|---:|---|---:|---:|---:|---:|
| 35180 | jonathanvareymitchell | 74 | 4,241.95 | €15,133.68 | €14,267.98 |
| 35272 | Mertyoz | 30 | 3,377.77 | €13,262.45 | €8,760.25 |
| 2287 | (unknown) | 28 | 3,822.96 | €3,887.28 | €2,720.10 |
| 35198 | junjix | 21 | 5,083.38 | €12,330.47 | €12,249.75 |
| 35197 | Basilatwani | 21 | 3,257.43 | €29,542.75 | €28,809.29 |
| 35273 | Fredtrading | 17 | 3,376.71 | €5,393.11 | €5,069.34 |
| 35143 | ajmudronja | 12 | 3,906.42 | €15,046.81 | €9,512.92 |
| 35270 | WealthWave | 9 | 3,883.22 | €18,476.54 | €11,474.24 |
| 35290 | masternl | 8 | 2,916.38 | €4,821.67 | €4,801.77 |
| 35171 | fintechmediaadv | 5 | 3,820.40 | €5,356.32 | €5,072.02 |

### 5.3 Osservazione (concentrazione)
- Solo l’affiliate **35180** rappresenta **74/261 = 28.4%** degli Aggressive.
- Top 3 affiliate: **~50.6%** degli Aggressive.
- Top 5 affiliate: **~66.7%** degli Aggressive.

---

## 6) “Top 27 most active users” (da condividere con Chris)

**Scopo:** elenco operativo di controllo manuale/monitoraggio, indipendente dal beneficio economico (come richiesto).

**Regola segno:** positive economic result ⇒ Bullwaves gains; negative ⇒ trader gains.

| User ID | MT5 | Affiliate ID | Affiliate name | Country | Reg date | Positions | Net Deposits | Economic result (Bullwaves) |
|---|---:|---:|---|---|---|---:|---:|---:|
| bullwaves-208724 | 926195 | 35198 | junjix | Sweden | 2025-04-23 | 22,105 | €44,383 | €44,383 |
| bullwaves-308186 | 941940 | 35180 | jonathanvareymitchell | United Kingdom | 2025-06-08 | 18,670 | €60,699 | €58,191 |
| bullwaves-118308 | 911771 | 35180 | jonathanvareymitchell | United Kingdom | 2025-02-05 | 17,294 | €48,775 | €48,775 |
| bullwaves-174427 | 920925 | 35180 | jonathanvareymitchell | United Kingdom | 2025-03-30 | 16,814 | €75,175 | €75,175 |
| bullwaves-425687 | 1203445 | 2287 | (unknown) | United Kingdom | 2025-07-31 | 16,672 | €34,553 | €34,553 |
| bullwaves-129013 | 913521 | 35180 | jonathanvareymitchell | United Kingdom | 2025-02-15 | 15,089 | €23,358 | €23,358 |
| bullwaves-321738 | 943832 | 35198 | junjix | Switzerland | 2025-06-13 | 11,393 | €528 | €528 |
| bullwaves-210568 | 926487,939439,947986,948016,949662,951813,1308022,1311637,1311639,1311640,3000695 | 35143 | ajmudronja | Australia | 2025-04-23 | 10,536 | €80,150 | €20,539 |
| bullwaves-215547 | 927203 | 35197 | Basilatwani | New Zealand | 2025-04-26 | 10,226 | €13,423 | €13,423 |
| bullwaves-170726 | 920466 | 35180 | jonathanvareymitchell | United Kingdom | 2025-03-27 | 9,877 | €26,049 | €24,696 |
| bullwaves-674485 | 1313906,1314459,1319477 | 35273 | Fredtrading | Norway | 2025-10-28 | 9,727 | €35,813 | €35,813 |
| bullwaves-90627 | 907766 | 35143 | ajmudronja | Australia | 2025-01-15 | 8,069 | €2,702 | €2,406 |
| bullwaves-325226 | 944327 | 35272 | Mertyoz | United Kingdom | 2025-06-14 | 8,010 | €20,981 | €20,981 |
| bullwaves-312810 | 942595 | 2287 | (unknown) | Australia | 2025-06-10 | 7,793 | -€16,476 | -€16,476 |
| bullwaves-77182 | 905712 | 35171 | fintechmediaadv | Italy | 2024-12-26 | 7,621 | €9,973 | €9,351 |
| bullwaves-118938 | 911870 | 35180 | jonathanvareymitchell | United Kingdom | 2025-02-06 | 7,179 | €12,327 | €12,327 |
| bullwaves-401948 | 1200791 | 35270 | WealthWave | United Kingdom | 2025-07-20 | 6,911 | €20,106 | -€30,212 |
| bullwaves-189980 | 923121 | 35272 | Mertyoz | United Kingdom | 2025-04-11 | 6,758 | €27,162 | €27,063 |
| bullwaves-190646 | 923252 | 35198 | junjix | United Kingdom | 2025-04-11 | 6,754 | €16,075 | €15,878 |
| bullwaves-155724 | 917768 | 35198 | junjix | Canada | 2025-03-12 | 6,613 | €21,509 | €21,509 |
| bullwaves-512284 | 1214878 | 35180 | jonathanvareymitchell | United Kingdom | 2025-09-07 | 6,608 | €14,387 | €14,371 |
| bullwaves-519486 | 1215655 | 35273 | Fredtrading | Australia | 2025-09-10 | 6,322 | -€888 | -€888 |
| bullwaves-243951 | 931792 | 35198 | junjix | Romania | 2025-05-08 | 6,295 | €10,206 | €10,206 |
| bullwaves-333925 | 945489 | 35270 | WealthWave | Australia | 2025-06-18 | 6,212 | €58,935 | €58,935 |
| bullwaves-114103 | 911071 | 35180 | jonathanvareymitchell | Unknown Country | 2025-02-01 | 6,155 | €11,305 | €11,281 |
| bullwaves-173581 | 0 | 35227 | melofx | Italy | 2025-03-29 | 6,138 | €5,025 | €4,328 |
| bullwaves-239646 | 931125 | 35272 | Mertyoz | United Kingdom | 2025-05-06 | 5,893 | €25,686 | €25,617 |

---

## 7) Raccomandazioni (orientate a decisione)

### 7.1 Perché “vale la pena controllare”
- Il gruppo Aggressive è piccolo (261 utenti) ma estremamente intenso: **~19%** delle posizioni.
- La concentrazione per affiliate è elevata (top 5 = ~66.7% degli Aggressive) ⇒ ci sono “canali” specifici dove l’attività aggressiva è più probabile.

### 7.2 Cosa fare (azione concreta)
1) **Monitorare** i **Top 27 most active users** (tabella sopra) e condividerli con Chris.
2) **Deep dive per affiliate** (partendo dai top 5):
   - pattern temporali (trade burst, orari, giorni)
   - ripetizione di size / strumenti / durata posizioni
   - correlazioni tra utenti dello stesso affiliate
3) **Regole/guardrail**: se emergono pattern bot, definire controlli (rate limits, segnali di EA, controlli KYC/behavioral).

---

## 8) Limiti del dato (cose da sapere prima di “concludere”)

- **Position Count** è un proxy: molti trade non = bot in senso stretto, ma è un forte segnale “EA-like”.
- Il mapping `affiliate_id -> name` può risultare **(unknown)** se l’ID non è presente in Payments/commissions (es. affiliateId 2287).
- Questo report non considera (per ora) segnali più forti come:
  - correlazioni su simboli/timeframe
  - durata media posizioni
  - pattern di ingresso/uscita
  - IP/device fingerprinting

---

## 9) Come rigenerare il report

Da `Bullwaves_new/`:
- Rigenerare JSON + output console:
  - `node .\\scripts\\board_bot_analysis.js --start=2024-01-01`

I risultati aggiornati finiscono in:
- `Bullwaves_new/scripts/board_bot_analysis.output.json`

