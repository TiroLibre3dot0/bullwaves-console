declare module '../../i18n/I18nContext' {
  export type I18nParams = Record<string, unknown>

  export interface I18nContextValue {
    locale: string
    setLocale: (next: string) => void
    t: (key: string, params?: I18nParams) => string
    locales: string[]
  }

  export function useI18n(): I18nContextValue
  export function I18nProvider(props: { children?: import('react').ReactNode }): import('react').JSX.Element
}
