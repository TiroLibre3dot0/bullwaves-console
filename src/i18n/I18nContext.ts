// Typed wrapper around the existing JS implementation (I18nContext.jsx).
// Using a real TS module avoids "missing declaration file" errors under
// `moduleResolution: bundler` which prefers runtime JS/JSX files.

export type I18nParams = Record<string, unknown>

export interface I18nContextValue {
  locale: string
  setLocale: (next: string) => void
  t: (key: string, params?: I18nParams) => string
  locales: string[]
}

// Import the JS implementation explicitly.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useI18n as useI18nImpl, I18nProvider as I18nProviderImpl } from './I18nContext.jsx'

export const useI18n = useI18nImpl as unknown as () => I18nContextValue
export const I18nProvider = I18nProviderImpl as unknown as (props: {
  children?: import('react').ReactNode
}) => import('react').ReactElement
