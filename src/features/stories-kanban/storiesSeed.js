// Single source of truth for the 5 execution stories used across the Execution Hub.

export const seedStories = ({ locale } = {}) => {
  const lang = locale === 'it' ? 'it' : 'en'
  const pick = (en, it) => (lang === 'it' ? it : en)

  return [
    {
      id: 'story-growth-acq',
      epic: 'Acquisition',
      title: pick('Growth Engine: Acquisition & Brand', 'Motore di crescita: acquisizione & brand'),
      owner: pick('Marketing / Growth', 'Marketing / Growth'),
      progress: 0.28,
      risk: 'Medium',
      goal: pick(
        'Generate a predictable weekly flow of qualified first deposits.',
        'Generare un flusso settimanale prevedibile di primi depositi qualificati.'
      ),
      kpis: [
        {
          id: 'cpa',
          label: pick('Cost Per Acquisition (CPA)', 'Costo per acquisizione (CPA)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
        {
          id: 'ftd',
          label: pick('First Time Deposits (FTD)', 'Primi depositi (FTD)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
        {
          id: 'qftd',
          label: pick('Qualified First Time Deposits (QFTD)', 'Primi depositi qualificati (QFTD)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
      ],
      status: 'Executing',
      blockers: [
        pick(
          'Tracking gaps: UTM + event mapping not complete',
          'Gap di tracking: UTM + mappatura eventi non completata'
        ),
        pick(
          'No weekly baseline for CPA/FTD/QFTD by channel',
          'Nessuna baseline settimanale per CPA/FTD/QFTD per canale'
        ),
      ],
      decisions: [
        {
          text: pick(
            'Set CPA guardrail and weekly QFTD target.',
            'Definire guardrail CPA e target settimanale QFTD.'
          ),
          owner: pick('CEO / Finance', 'CEO / Finance'),
        },
        {
          text: pick(
            'Choose top 2 acquisition channels for the next 30 days.',
            'Scegliere i 2 canali di acquisizione principali per i prossimi 30 giorni.'
          ),
          owner: pick('Growth Lead', 'Growth Lead'),
        },
      ],
      tasks: [
        {
          id: 'task-growth-1',
          title: pick(
            'Launch tracking plan — UTM + core events',
            'Lanciare piano tracking — UTM + eventi core'
          ),
          context: pick(
            'Define UTM rules + core event map, implement them, then QA with test deposits. Output: tracking spec + checklist; target <2% sessions missing UTM and FTD/QFTD tracked end-to-end.',
            'Definisci regole UTM + mappa eventi core, implementa, poi fai QA con depositi test. Output: spec tracking + checklist; target <2% sessioni senza UTM e FTD/QFTD tracciati end-to-end.'
          ),
          owner: pick('Growth Ops', 'Growth Ops'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-growth-2',
          title: pick(
            'Build acquisition dashboard — CPA/FTD/QFTD by channel',
            'Creare dashboard acquisizione — CPA/FTD/QFTD per canale'
          ),
          context: pick(
            'Build a dashboard that shows CPA/FTD/QFTD by channel, updated daily. Output: a weekly exec snapshot (link + notes) used in the Command Center review.',
            'Crea una dashboard con CPA/FTD/QFTD per canale, aggiornata ogni giorno. Output: uno snapshot executive settimanale (link + note) usato nel review del Command Center.'
          ),
          owner: pick('BI', 'BI'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-growth-3',
          title: pick(
            'Ship landing pages — 3 high-intent pages',
            'Rilasciare landing page — 3 pagine high-intent'
          ),
          context: pick(
            'Publish 3 high-intent landing pages and wire full-funnel tracking (view → signup → deposit). Output: QFTD/page and weekly conversion review with next actions.',
            'Pubblica 3 landing page high-intent e collega il tracking di funnel (view → signup → deposito). Output: QFTD/pagina e review settimanale conversioni con azioni successive.'
          ),
          owner: pick('Web', 'Web'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-growth-4',
          title: pick(
            'Deploy paid tests — 10 ads + clear stop rules',
            'Eseguire test paid — 10 ads + regole di stop chiare'
          ),
          context: pick(
            'Launch 10 ads with explicit stop/scale rules (CPA + QFTD). Review after 72h, keep 2–3 winners, and document what changes in creative/targeting.',
            'Lancia 10 ads con regole chiare di stop/scale (CPA + QFTD). Review dopo 72h, tieni 2–3 vincenti e documenta cosa cambia in creatività/targeting.'
          ),
          owner: pick('Paid', 'Paid'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-growth-5',
          title: pick(
            'Publish content calendar — 4 weeks scheduled',
            'Pubblicare calendario contenuti — 4 settimane pianificate'
          ),
          context: pick(
            'Plan and schedule 4 weeks of content (3 posts/week). Make links trackable and report weekly: reach → clicks → assisted FTD/QFTD impact.',
            'Pianifica e programma 4 settimane di contenuti (3 post/settimana). Usa link tracciabili e riporta ogni settimana: reach → click → impatto assistito su FTD/QFTD.'
          ),
          owner: pick('Content', 'Content'),
          done: false,
          impact: 'Medium',
        },
      ],
    },
    {
      id: 'story-partners-ib',
      epic: 'Acquisition',
      title: pick(
        'Partners & IB: Commercial Ops Stack',
        'Partner & IB: stack operativo commerciale'
      ),
      owner: pick('Partnerships / Sales Ops', 'Partnerships / Sales Ops'),
      progress: 0.18,
      risk: 'High',
      goal: pick(
        'Make partner onboarding and payouts fast, accurate, and auditable.',
        'Rendere onboarding partner e pagamenti rapidi, accurati e verificabili.'
      ),
      kpis: [
        {
          id: 'aib',
          label: pick('Active Introducing Brokers (AIB)', 'Introducing Broker attivi (AIB)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
        {
          id: 'tfrd',
          label: pick(
            'Time to First Referred Deposit (TFRD)',
            'Tempo al primo deposito referral (TFRD)'
          ),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
        {
          id: 'per',
          label: pick('Payout Error Rate (PER)', 'Tasso errori payout (PER)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
      ],
      status: 'Executing',
      blockers: [
        pick('Partner terms scattered across chats/files', 'Termini partner sparsi tra chat/file'),
        pick(
          'No single payout calculation reference',
          'Nessuna fonte unica per il calcolo dei payout'
        ),
      ],
      decisions: [
        {
          text: pick(
            'Approve partner report template + cadence.',
            'Approvare template report partner + cadenza.'
          ),
          owner: pick('COO', 'COO'),
        },
        {
          text: pick(
            'Confirm multi-level IB model and qualification rules.',
            'Confermare modello IB multi-livello e regole di qualificazione.'
          ),
          owner: pick('Partnerships Lead', 'Partnerships Lead'),
        },
      ],
      tasks: [
        {
          id: 'task-partners-1',
          title: pick(
            'Ship partner onboarding flow — signup → approval pipeline',
            'Rilasciare onboarding partner — signup → pipeline approvazione'
          ),
          context: pick(
            'Design and ship the signup → approval pipeline. Output: onboarding SLA ≤ 48h, drop-off tracked by step, and a clear owner for approvals.',
            'Progetta e rilascia la pipeline signup → approvazione. Output: SLA onboarding ≤ 48h, drop-off tracciato per step e owner chiaro per le approvazioni.'
          ),
          owner: pick('Partnerships Ops', 'Partnerships Ops'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-partners-2',
          title: pick(
            'Create partner portal — referral link + KPI view',
            'Creare partner portal — referral link + vista KPI'
          ),
          context: pick(
            'Build a simple partner portal where partners can generate referral links and see KPIs. Output: ≥90% partners self-serve links + basic stats without ops support.',
            'Crea un partner portal semplice per generare referral link e vedere i KPI. Output: ≥90% partner in self-service su link + statistiche base senza supporto ops.'
          ),
          owner: pick('BI', 'BI'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-partners-3',
          title: pick(
            'Deploy payout calculator — rules + tiers',
            'Rilasciare calcolatore payout — regole + tier'
          ),
          context: pick(
            'Implement the payout rules + tiers in a single calculator. Output: 100% match on agreed sample cases and a versioned rules doc as source of truth.',
            'Implementa regole + tier payout in un unico calcolatore. Output: match al 100% sui casi campione concordati e documento regole versionato come fonte unica.'
          ),
          owner: pick('Partnerships', 'Partnerships'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-partners-4',
          title: pick(
            'Release payout report — monthly CSV + ledger',
            'Rilasciare report payout — CSV mensile + ledger'
          ),
          context: pick(
            'Generate a monthly payout CSV + ledger from the calculator. Output: report produced in <5 minutes with PER <0.5% and an audit trail for disputes.',
            'Genera un CSV payout mensile + ledger dal calcolatore. Output: report in <5 minuti con PER <0,5% e audit trail per eventuali contestazioni.'
          ),
          owner: pick('Finance', 'Finance'),
          done: false,
          impact: 'Medium',
        },
        {
          id: 'task-partners-5',
          title: pick(
            'Automate partner attribution — referral → client match',
            'Automatizzare attribuzione partner — referral → match cliente'
          ),
          context: pick(
            'Automate referral → client matching (rules + fallback). Output: <1% unmatched referrals, weekly audit report, and a clear process for fixing exceptions.',
            'Automatizza il match referral → cliente (regole + fallback). Output: <1% referral non matchati, report audit settimanale e processo chiaro per gestire le eccezioni.'
          ),
          owner: pick('Data', 'Data'),
          done: false,
          impact: 'High',
        },
      ],
    },
    {
      id: 'story-product-crm',
      epic: 'Platform',
      title: pick(
        'Client Experience: Product, CRM & Education',
        'Esperienza cliente: prodotto, CRM & education'
      ),
      owner: pick('Product / CRM', 'Product / CRM'),
      progress: 0.22,
      risk: 'Medium',
      goal: pick(
        'Increase activation and reduce support load with CRM flows and education.',
        'Aumentare l’attivazione e ridurre il carico supporto con flussi CRM ed education.'
      ),
      kpis: [
        {
          id: 'ar',
          label: pick('Activation Rate (AR)', 'Tasso di attivazione (AR)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
        {
          id: 'nps',
          label: pick('Net Promoter Score (NPS)', 'Net Promoter Score (NPS)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
        {
          id: 'frt',
          label: pick('First Response Time (FRT)', 'Tempo prima risposta (FRT)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
      ],
      status: 'Executing',
      blockers: [
        pick(
          'CRM triggers not mapped to user lifecycle',
          'Trigger CRM non mappati sul lifecycle utente'
        ),
        pick(
          'Education content not linked to activation steps',
          'Contenuti education non collegati agli step di attivazione'
        ),
      ],
      decisions: [
        {
          text: pick(
            'Define the 7-day onboarding steps and target AR.',
            'Definire step onboarding 7 giorni e target AR.'
          ),
          owner: pick('Product Lead', 'Product Lead'),
        },
        {
          text: pick(
            'Choose the 3 CRM flows to ship first.',
            'Scegliere i 3 flussi CRM da rilasciare per primi.'
          ),
          owner: pick('COO / Growth', 'COO / Growth'),
        },
      ],
      tasks: [
        {
          id: 'task-product-1',
          title: pick(
            'Map client journey — 1-page funnel spec',
            'Mappare journey cliente — funnel spec in 1 pagina'
          ),
          context: pick(
            'Write a 1-page funnel spec for the client journey (steps, owners, and metrics). Output: a shared doc used to prioritize CRM + product work for the next 30 days.',
            'Scrivi una funnel spec in 1 pagina per la journey cliente (step, owner e metriche). Output: documento condiviso usato per prioritizzare CRM + prodotto nei prossimi 30 giorni.'
          ),
          owner: pick('Product', 'Product'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-product-2',
          title: pick(
            'Build CRM lifecycle — 6 triggered message flows',
            'Costruire lifecycle CRM — 6 flussi messaggi triggerati'
          ),
          context: pick(
            'Implement 6 triggered CRM flows (rules + content + QA). Output: test accounts receive the right messages at the right time; log coverage ≥90% of trigger cases.',
            'Implementa 6 flussi CRM triggerati (regole + contenuti + QA). Output: gli account test ricevono i messaggi corretti; copertura log ≥90% dei casi trigger.'
          ),
          owner: pick('CRM', 'CRM'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-product-3',
          title: pick(
            'Launch onboarding emails — 7-day sequence',
            'Lanciare email onboarding — sequenza 7 giorni'
          ),
          context: pick(
            'Launch a 7-day onboarding email sequence aligned to activation steps. Output: weekly report with open/click + Activation Rate changes and what to tweak next.',
            'Lancia una sequenza email onboarding di 7 giorni allineata agli step di attivazione. Output: report settimanale con open/click + variazione AR e cosa ottimizzare.'
          ),
          owner: pick('CRM', 'CRM'),
          done: false,
          impact: 'Medium',
        },
        {
          id: 'task-product-4',
          title: pick(
            'Publish education hub — 10 core lessons',
            'Pubblicare education hub — 10 lezioni core'
          ),
          context: pick(
            'Publish an education hub with 10 core lessons tied to onboarding. Output: lesson completion tracked per user and a “next best lesson” path in CRM.',
            'Pubblica un education hub con 10 lezioni core collegate all’onboarding. Output: completamento lezioni tracciato per utente e percorso “prossima lezione” in CRM.'
          ),
          owner: pick('Content', 'Content'),
          done: false,
          impact: 'Medium',
        },
        {
          id: 'task-product-5',
          title: pick(
            'Create support macro pack — 20 canned replies',
            'Creare pacchetto macro supporto — 20 risposte predefinite'
          ),
          context: pick(
            'Create 20 support macros for the top recurring issues and train the team. Output: macros live in the tool + weekly tracking of usage and First Response Time.',
            'Crea 20 macro supporto per i problemi ricorrenti principali e allinea il team. Output: macro live nello strumento + tracking settimanale utilizzo e First Response Time.'
          ),
          owner: pick('Support', 'Support'),
          done: false,
          impact: 'Medium',
        },
      ],
    },
    {
      id: 'story-retention-prop',
      epic: 'Retention',
      title: pick(
        'Prop & Retention: Reactivation + Payments Friction',
        'Prop & retention: riattivazione + frizioni pagamenti'
      ),
      owner: pick('Growth / Risk', 'Growth / Risk'),
      progress: 0.16,
      risk: 'High',
      goal: pick(
        'Recover inactive users and reduce deposit/withdrawal failures.',
        'Recuperare utenti inattivi e ridurre i fallimenti di deposito/prelievo.'
      ),
      kpis: [
        {
          id: 'nd',
          label: pick('Net Deposits (ND)', 'Depositi netti (ND)'),
          current: '—',
          target: '—',
        },
        { id: 'dep', label: pick('Deposits (DEP)', 'Depositi (DEP)'), current: '—', target: '—' },
        { id: 'wd', label: pick('Withdrawals (WD)', 'Prelievi (WD)'), current: '—', target: '—' },
      ],
      status: 'Executing',
      blockers: [
        pick('Failed deposits not logged end-to-end', 'Depositi falliti non tracciati end-to-end'),
        pick('Withdrawal status unclear for clients', 'Stato prelievo non chiaro lato cliente'),
      ],
      decisions: [
        {
          text: pick(
            'Pick top 3 payment errors to fix first.',
            'Selezionare i 3 principali errori pagamenti da risolvere per primi.'
          ),
          owner: pick('COO', 'COO'),
        },
        {
          text: pick(
            'Set guardrails for fraud + compliance checks.',
            'Definire guardrail per controlli frodi + compliance.'
          ),
          owner: pick('Risk / Compliance', 'Risk / Compliance'),
        },
      ],
      tasks: [
        {
          id: 'task-retention-1',
          title: pick(
            'Define churn segments — inactive cohorts list',
            'Definire segmenti churn — lista coorti inattive'
          ),
          context: pick(
            'Define churn segments and produce a weekly export of inactive cohorts. Output: a cohort list ready for CRM campaigns + Reactivation Rate tracked per cohort.',
            'Definisci segmenti churn e produci un export settimanale delle coorti inattive. Output: lista coorti pronta per campagne CRM + Reactivation Rate tracciato per coorte.'
          ),
          owner: pick('Growth', 'Growth'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-retention-2',
          title: pick(
            'Launch reactivation sequences — 3 campaigns',
            'Lanciare sequenze riattivazione — 3 campagne'
          ),
          context: pick(
            'Ship 3 reactivation campaigns (copy + audience + send schedule). Output: campaigns live with RR tracked per cohort and a weekly iteration plan.',
            'Rilascia 3 campagne di riattivazione (copy + audience + calendario invii). Output: campagne live con RR tracciato per coorte e piano di iterazione settimanale.'
          ),
          owner: pick('CRM', 'CRM'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-retention-3',
          title: pick(
            'Build payment failure log — error dashboard',
            'Creare log fallimenti pagamenti — dashboard errori'
          ),
          context: pick(
            'Log payment failures end-to-end and build an error dashboard. Output: top 10 errors ranked by volume and a clear “owner + next fix” for each.',
            'Traccia i fallimenti pagamenti end-to-end e crea una dashboard errori. Output: top 10 errori per volume e un “owner + prossima fix” per ciascuno.'
          ),
          owner: pick('BI', 'BI'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-retention-4',
          title: pick(
            'Fix top 3 payment blockers — patch + release notes',
            'Fixare top 3 blocker pagamenti — patch + release notes'
          ),
          context: pick(
            'Fix the top 3 payment blockers and ship with release notes. Output: PSR tracked daily and the top-3 error volumes drop week-over-week.',
            'Risolvi i 3 principali blocker pagamenti e rilascia con release notes. Output: PSR tracciato ogni giorno e volumi top-3 errori in calo week-over-week.'
          ),
          owner: pick('Engineering', 'Engineering'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-retention-5',
          title: pick(
            'Ship withdrawal status page — client-visible tracker',
            'Rilasciare pagina stato prelievi — tracker visibile al cliente'
          ),
          context: pick(
            'Build a client-visible withdrawal status tracker (states + ETA + support fallback). Output: weekly “status” ticket volume tracked and reduced week-over-week.',
            'Crea un tracker stato prelievi visibile al cliente (stati + ETA + fallback supporto). Output: volume ticket “stato” tracciato e ridotto week-over-week.'
          ),
          owner: pick('Product', 'Product'),
          done: false,
          impact: 'Medium',
        },
      ],
    },
    {
      id: 'story-ops-org',
      epic: 'Ops',
      title: pick(
        'Ops & Org: Platform Stability + Company Setup',
        'Ops & org: stabilità piattaforma + setup aziendale'
      ),
      owner: pick('COO / Ops', 'COO / Ops'),
      progress: 0.24,
      risk: 'Medium',
      goal: pick(
        'Keep the platform reliable and the company operationally ready.',
        'Mantenere la piattaforma affidabile e l’azienda pronta operativamente.'
      ),
      kpis: [
        {
          id: 'su',
          label: pick('Service Uptime (SU)', 'Uptime servizio (SU)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
        {
          id: 'mttr',
          label: pick('Mean Time to Recovery (MTTR)', 'Tempo medio ripristino (MTTR)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
        {
          id: 'stb',
          label: pick('Support Ticket Backlog (STB)', 'Backlog ticket supporto (STB)'),
          current: '—',
          target: pick('Defined', 'Definito'),
        },
      ],
      status: 'Executing',
      blockers: [
        pick(
          'No incident checklist used consistently',
          'Checklist incident non usata in modo consistente'
        ),
        pick(
          'Key operational accounts/docs not centralized',
          'Account/documenti operativi chiave non centralizzati'
        ),
      ],
      decisions: [
        {
          text: pick(
            'Confirm owners for on-call, releases, and incident comms.',
            'Confermare owner per reperibilità, release e comunicazioni incident.'
          ),
          owner: pick('CEO / COO', 'CEO / COO'),
        },
        {
          text: pick(
            'Approve LP migration timeline and rollback plan.',
            'Approvare timeline migrazione LP e piano rollback.'
          ),
          owner: pick('Ops Lead', 'Ops Lead'),
        },
      ],
      tasks: [
        {
          id: 'task-ops-1',
          title: pick(
            'Set up monitoring — uptime + error alerts',
            'Configurare monitoring — uptime + alert errori'
          ),
          context: pick(
            'Set up uptime + error monitoring with alerts to the right channel. Output: alerts fire within 2 minutes and a runbook link is attached to the alert.',
            'Configura monitoraggio uptime + errori con alert sul canale corretto. Output: alert entro 2 minuti e link al runbook allegato all’alert.'
          ),
          owner: pick('Engineering', 'Engineering'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-ops-2',
          title: pick(
            'Publish incident playbook — 1-page runbook',
            'Pubblicare playbook incident — runbook 1 pagina'
          ),
          context: pick(
            'Publish a 1-page incident playbook (roles, comms, checklist). Output: used in the next incident and reduces time-to-triage / MTTR.',
            'Pubblica un playbook incident in 1 pagina (ruoli, comms, checklist). Output: usato nel prossimo incident e riduce time-to-triage / MTTR.'
          ),
          owner: pick('Ops', 'Ops'),
          done: false,
          impact: 'Medium',
        },
        {
          id: 'task-ops-3',
          title: pick(
            'Add release checklist — pre/post deploy steps',
            'Aggiungere checklist release — step pre/post deploy'
          ),
          context: pick(
            'Create a lightweight pre/post deploy checklist and enforce it. Output: 100% releases follow it for 4 weeks (with links to deploy notes).',
            'Crea una checklist leggera pre/post deploy e rendila standard. Output: 100% release la seguono per 4 settimane (con link alle deploy notes).'
          ),
          owner: pick('Engineering', 'Engineering'),
          done: false,
          impact: 'Medium',
        },
        {
          id: 'task-ops-4',
          title: pick(
            'Create admin audit log — key actions tracked',
            'Creare audit log admin — azioni chiave tracciate'
          ),
          context: pick(
            'Add an admin audit log for critical actions. Output: every critical action stores user + timestamp + payload, and can be exported for reviews.',
            'Aggiungi un audit log admin per azioni critiche. Output: ogni azione critica salva utente + timestamp + payload ed è esportabile per review.'
          ),
          owner: pick('Engineering', 'Engineering'),
          done: false,
          impact: 'High',
        },
        {
          id: 'task-ops-5',
          title: pick(
            'Build weekly ops report — SLA + risks summary',
            'Creare report ops settimanale — SLA + sintesi rischi'
          ),
          context: pick(
            'Produce one ops report per week (SLA, incidents, risks, backlog). Output: trend lines visible and clear owners for follow-ups.',
            'Produci un report ops a settimana (SLA, incident, rischi, backlog). Output: trend visibili e owner chiari per i follow-up.'
          ),
          owner: pick('Ops', 'Ops'),
          done: false,
          impact: 'Medium',
        },
      ],
    },
  ]
}
