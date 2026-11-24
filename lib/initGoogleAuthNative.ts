import { Capacitor } from "@capacitor/core"
import { SocialLogin } from "@capgo/capacitor-social-login"
import { assertGoogleIOSClientId, assertGoogleWebClientId } from "@/lib/googleAuthConfig"

let nativeGoogleAuthReady = false
let nativeGoogleAuthPromise: Promise<void> | null = null

export function initializeGoogleAuthNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return Promise.resolve()
  }

  if (nativeGoogleAuthReady) {
    return Promise.resolve()
  }

  if (!nativeGoogleAuthPromise) {
    try {
      const webClientId = assertGoogleWebClientId()
      const iosOptions = Capacitor.getPlatform() === "ios"
        ? { iOSClientId: assertGoogleIOSClientId(), iOSServerClientId: webClientId }
        : {}

      nativeGoogleAuthPromise = SocialLogin.initialize({
        google: {
          webClientId,
          ...iosOptions,
          mode: "online",
        },
      })
        .then(() => {
          nativeGoogleAuthReady = true
        })
        .catch((error) => {
          nativeGoogleAuthPromise = null
          throw error
        })
    } catch (error) {
      nativeGoogleAuthPromise = null
      return Promise.reject(error)
    }
  }

  return nativeGoogleAuthPromise
}
