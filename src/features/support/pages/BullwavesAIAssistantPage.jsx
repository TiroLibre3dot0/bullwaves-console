import { useEffect, useMemo, useRef, useState } from 'react'

import { useI18n } from '../../../i18n/I18nContext'
import {
  CONTACTS,
  detectLanguage,
  getAssistantReply,
  getQuickReplies,
  getUiCopy,
} from '../services/bullwavesAssistantEngine'

function formatTimestamp(date, locale) {
  try {
    return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return ''
  }
}

function createBotMessage(text, language) {
  return {
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'bot',
    language,
    text,
    createdAt: new Date(),
  }
}

function createUserMessage(text, language) {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    language,
    text,
    createdAt: new Date(),
  }
}

export default function BullwavesAIAssistantPage() {
  const { locale } = useI18n()
  const pageLocale = locale === 'it' ? 'it' : 'en'
  const copy = useMemo(() => getUiCopy(pageLocale), [pageLocale])
  const quickReplies = useMemo(() => getQuickReplies(pageLocale), [pageLocale])
  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState(() => [createBotMessage(copy.welcome, pageLocale)])
  const historyRef = useRef(null)

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.role !== 'bot') return current
      return [createBotMessage(copy.welcome, pageLocale)]
    })
  }, [copy.welcome, pageLocale])

  useEffect(() => {
    const el = historyRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isTyping])

  const submitMessage = (rawText) => {
    const text = String(rawText || '').trim()
    if (!text || isTyping) return

    const language = detectLanguage(text, pageLocale)
    const userMessage = createUserMessage(text, language)
    const reply = getAssistantReply(text, pageLocale)

    setMessages((current) => [...current, userMessage])
    setDraft('')
    setIsTyping(true)

    window.setTimeout(() => {
      setMessages((current) => [...current, createBotMessage(reply.text, reply.language)])
      setIsTyping(false)
    }, 420)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    submitMessage(draft)
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitMessage(draft)
    }
  }

  return (
    <div className="page-shell ai-assistant-page">
      <div className="ai-assistant-page__layout">
        <div className="ai-assistant-page__main">
          <section className="card card-global ai-assistant-page__header">
            <div className="ai-assistant-page__eyebrow">{copy.eyebrow}</div>
            <div className="ai-assistant-page__titleRow">
              <h1 className="ai-assistant-page__title">{copy.title}</h1>
              <div className="ai-assistant-page__badge">{copy.badge}</div>
            </div>
            <p className="ai-assistant-page__subtitle">{copy.subtitle}</p>
            <div className="ai-assistant-page__chips">
              {copy.chips.map((chip) => (
                <span key={chip} className="ai-assistant-page__chip">
                  {chip}
                </span>
              ))}
            </div>
          </section>

          <section className="card card-global ai-chat">
            <div ref={historyRef} className="ai-chat__history" aria-live="polite">
              {messages.map((message) => {
                const isUser = message.role === 'user'
                const rowClass = isUser
                  ? 'ai-chat__row ai-chat__row--user'
                  : 'ai-chat__row ai-chat__row--bot'
                const bubbleClass = isUser
                  ? 'ai-chat__bubble ai-chat__bubble--user'
                  : 'ai-chat__bubble ai-chat__bubble--bot'
                const author = isUser ? 'You' : 'Bullwaves AI Assistant'
                const languageLabel = message.language === 'it' ? 'IT' : 'EN'

                return (
                  <div key={message.id} className={rowClass}>
                    <div className={bubbleClass}>
                      <div className="ai-chat__meta">
                        <span>{author}</span>
                        <span className="ai-chat__metaBadge">
                          {languageLabel} · {formatTimestamp(message.createdAt, message.language)}
                        </span>
                      </div>
                      <div className="ai-chat__text">{message.text}</div>
                    </div>
                  </div>
                )
              })}

              {isTyping ? (
                <div className="ai-chat__row ai-chat__row--typing" aria-label={copy.typing}>
                  <div className="ai-chat__bubble ai-chat__bubble--bot">
                    <div className="ai-chat__meta">
                      <span>Bullwaves AI Assistant</span>
                      <span className="ai-chat__metaBadge">…</span>
                    </div>
                    <div className="ai-chat__typingDots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="ai-chat__composerWrap">
              <div className="ai-chat__quickReplies">
                {quickReplies.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-chat__quickReply"
                    onClick={() => submitMessage(prompt)}
                    disabled={isTyping}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form className="ai-chat__composer" onSubmit={onSubmit}>
                <textarea
                  className="ai-chat__input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={copy.inputPlaceholder}
                  rows={2}
                />
                <button
                  className="ai-chat__send"
                  type="submit"
                  disabled={!draft.trim() || isTyping}
                >
                  {copy.send}
                </button>
              </form>
              <div className="ai-chat__hint">{copy.inputHint}</div>
            </div>
          </section>
        </div>

        <aside className="ai-assistant-page__rail ai-assistant-rail">
          <section className="card card-global ai-assistant-rail__card">
            <div className="ai-assistant-rail__eyebrow">Policy</div>
            <h2 className="ai-assistant-rail__title">{copy.railPolicyTitle}</h2>
            <div className="ai-assistant-rail__text">{copy.railPolicyText}</div>
          </section>

          <section className="card card-global ai-assistant-rail__card">
            <div className="ai-assistant-rail__eyebrow">Escalation</div>
            <h2 className="ai-assistant-rail__title">{copy.railEscalationTitle}</h2>
            <ul className="ai-assistant-rail__list">
              {copy.railEscalations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="card card-global ai-assistant-rail__card">
            <div className="ai-assistant-rail__eyebrow">Contacts</div>
            <h2 className="ai-assistant-rail__title">{copy.railContactsTitle}</h2>
            {Object.entries(copy.contacts).map(([key, label]) => (
              <div key={key} className="ai-assistant-rail__contact">
                <div className="ai-assistant-rail__contactLabel">{label}</div>
                <div className="ai-assistant-rail__contactValue">{CONTACTS[key]}</div>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  )
}
