// Typed shim for the JS-only Support User Check service.
// Keeps TS strictness in feature code without forcing a full TS migration of the Support area.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JS module has no TS typings (shimmed here)
import * as svc from './supportUserCheckService'

export const loadCsvRows: (force?: boolean) => Promise<any[]> = (svc as any).loadCsvRows

export const computeActivityIntelligence: (row: any, now?: Date) => any = (svc as any)
  .computeActivityIntelligence
