# Code Quality & CI/CD Setup

## Overview
Questo progetto utilizza **Husky** + **Lint-Staged** + **ESLint** + **Prettier** + **GitHub Actions** per garantire code quality e prevenire errori prima del merge.

## Pre-Commit Hooks (Locale)

### Come funziona
1. Quando fai `git commit`, Husky intercepta il commit
2. Esegue `lint-staged`, che:
   - Rulla **ESLint** sui file `.js` e `.jsx` modificati
   - Rulla **Prettier** per formattare il codice
   - Se ci sono errori non-fixable, **blocca il commit** ✋

### Workflow
```bash
# 1. Fai le tue modifiche
# 2. Stage i file
git add src/features/roadmap/components/WeeklyMapView.jsx

# 3. Prova a commitare
git commit -m "fix: Weekly Map issue"

# Husky intercetta e rulla lint-staged
# Se tutto va bene → commit succeeds ✅
# Se ci sono errori → commit blocca ❌
```

### Se il commit fallisce
```bash
# ESLint ha trovato un errore
# 1. Leggi il messaggio di errore
# 2. Ripara l'errore nel file
# 3. Ritenta il commit
git commit -m "fix: Weekly Map issue"
```

## ESLint & Prettier (Manuale)

### Controllare i file
```bash
npm run lint              # Solo check (read-only)
npm run lint:fix          # Auto-fix errori
```

### Formattare specifici file
```bash
npx prettier --write src/features/roadmap/components/WeeklyMapView.jsx
```

## GitHub Actions (CI/CD)

### Cosa succede
Ogni volta che fai **push** o **apri una PR**, GitHub Actions:
1. ✅ Installa dipendenze
2. ✅ Rulla ESLint (no auto-fix)
3. ✅ Buildda il progetto
4. ✅ Verifica sintassi

Se uno step fallisce, **il build è marcato come fallito** 🔴 e il team vede subito il problema.

### Branch Protection
Per aggiungere protezione al branch `main`:
1. Vai a **Settings** → **Branches** → **main**
2. Abilita **Require status checks to pass**
3. Seleziona il workflow `Lint & Build Validation`

→ **Nessuno potrà mergiare senza che il workflow passi**

## Timeline degli Errori (Previsto vs Reale)

### Esempio: Duplicate export error

**Prima** (senza setup):
- ❌ Scrivi codice
- ❌ Committa + pusha
- ❌ Team scopre l'errore in staging
- ❌ Devi fare rollback/fix hotfix

**Dopo** (con setup):
```
Scrivi codice
↓
git add ...
↓
git commit -m "..."
↓
Husky + lint-staged esegue ESLint
↓
❌ ERRORE: "Duplicate export of 'upsertWeeklyTask'"
↓
Commit BLOCCATO (non puoi neanche pushare)
↓
Ripari l'errore nel file
↓
git commit -m "..."
↓
✅ OK → Commit succeeds
```

## File Importanti

- `.husky/pre-commit` — Hook che corre prima di ogni commit
- `.prettierrc.json` — Config per Prettier (formatting)
- `.eslintrc.cjs` — Config per ESLint (linting, se esiste)
- `.github/workflows/validate.yml` — GitHub Actions workflow
- `package.json` — Scripts e lint-staged config

## Commands Utili

```bash
# Install everything
npm install

# Lint e auto-fix
npm run lint:fix

# Solo check (non auto-fix)
npm run lint

# Build
npm run build

# Dev mode
npm run dev
```

## Q&A

**D: Cosa succede se voglio skippare il hook?**
A: `git commit --no-verify` (non consigliato, ma funziona in emergenza)

**D: Posso editare i file durante il pre-commit hook?**
A: No, lint-staged fa stage automaticamente i fix, quindi il commit include automaticamente le correzioni.

**D: Cosa fare se GitHub Actions fallisce?**
A: Leggi il log, ripara localmente, committa e ripushia.
