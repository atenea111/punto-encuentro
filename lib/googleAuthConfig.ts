/**
 * Web Client ID de Google OAuth (tipo "Web", NO el de Android).
 */
export const GOOGLE_WEB_CLIENT_ID =
  "1053356946867-csuhba1oi576o54fh554t9qv0jgtt0c0.apps.googleusercontent.com"

export function assertGoogleIOSClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim()
  if (!clientId) {
    throw new Error(
      "Falta NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID. Configurá el cliente OAuth de iOS y volvé a compilar. Ver GUIA_IOS.md."
    )
  }
  return clientId
}

export function assertGoogleWebClientId(): string {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      "Falta el Web Client ID de Google."
    )
  }
  return GOOGLE_WEB_CLIENT_ID
}
