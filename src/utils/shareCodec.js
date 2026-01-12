import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export function encodeSharePayload(payload) {
  try {
    const json = JSON.stringify(payload)
    return compressToEncodedURIComponent(json)
  } catch {
    return ''
  }
}

export function decodeSharePayload(encoded) {
  try {
    if (!encoded) return null
    const json = decompressFromEncodedURIComponent(String(encoded))
    if (!json) return null
    return JSON.parse(json)
  } catch {
    return null
  }
}
