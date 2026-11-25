const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Verifica las decisiones del código compartido; no sustituye pruebas en iPhone.
function loadSource(relativePath, dependencies, env = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require(name) {
      assert.ok(name in dependencies, `Dependencia inesperada: ${name}`)
      return dependencies[name]
    },
    process: { env },
    console,
    Date,
    ...globals,
  }, { filename: relativePath })
  return module.exports
}

const flush = () => new Promise(resolve => setImmediate(resolve))

function mountViewport(platform, addListener) {
  let cleanup
  let frame
  let changes = 0
  const scrollCalls = []
  const keyboardEvents = new Map()
  const viewportEvents = new Map()
  const visualViewport = {
    offsetTop: 0, height: 800,
    addEventListener: (name, listener) => viewportEvents.set(name, listener),
    removeEventListener: name => viewportEvents.delete(name),
  }
  const code = loadSource('hooks/useKeyboardInset.ts', {
    react: {
      useState(initial) {
        frame = initial()
        return [frame, value => {
          const next = typeof value === 'function' ? value(frame) : value
          if (next !== frame) changes++
          frame = next
        }]
      },
      useEffect(effect) { cleanup = effect() },
    },
    '@capacitor/core': { Capacitor: {
      isNativePlatform: () => platform !== 'web', getPlatform: () => platform,
    } },
    '@capacitor/keyboard': { Keyboard: {
      async setScroll(value) { scrollCalls.push(value.isDisabled) },
      addListener: addListener || (async (name, listener) => {
        keyboardEvents.set(name, listener)
        return { remove() { keyboardEvents.delete(name) } }
      }),
    } },
  }, {}, { window: {
    innerHeight: 800, visualViewport,
    addEventListener() {}, removeEventListener() {},
  } })
  code.useVisibleViewport()
  return { cleanup: () => cleanup(), scrollCalls, keyboardEvents, viewportEvents,
    visualViewport, frame: () => frame, changes: () => changes }
}

for (const platform of ['ios', 'android', 'web']) {
  test(`El teclado conserva el scroll de la página en ${platform}`, async () => {
    const viewport = mountViewport(platform)
    await flush()
    assert.deepEqual(viewport.scrollCalls, platform === 'ios' ? [false] : [])
    assert.equal(viewport.changes(), 0, 'Montar el hook no cambia una geometría idéntica')
    viewport.viewportEvents.get('scroll')()
    viewport.viewportEvents.get('scroll')()
    assert.equal(viewport.changes(), 0, 'Desplazarse sin cambiar el área visible no debe volver a renderizar')
    if (platform !== 'web') {
      viewport.keyboardEvents.get('keyboardWillShow')({ keyboardHeight: 300 })
      assert.equal(viewport.frame().keyboardInset, 300)
      assert.equal(viewport.frame().height, 500)
      viewport.keyboardEvents.get('keyboardDidShow')({ keyboardHeight: 300 })
      assert.equal(viewport.changes(), 1, 'El mismo evento didShow no duplica el render')
      viewport.keyboardEvents.get('keyboardDidHide')()
      assert.equal(viewport.frame().height, 800)
      assert.equal(viewport.frame().keyboardInset, 0)
    }
    viewport.cleanup()
    assert.equal(viewport.keyboardEvents.size, 0)
    assert.equal(viewport.viewportEvents.size, 0)
  })
}

test('El teclado elimina los listeners que terminan de registrarse después de salir', async () => {
  const releases = []
  let removed = 0
  const viewport = mountViewport('ios', () => new Promise(resolve => {
    releases.push(() => resolve({ remove() { removed++ } }))
  }))
  await flush()
  assert.equal(releases.length, 4)
  viewport.cleanup()
  releases.forEach(release => release())
  await flush()
  assert.equal(removed, 4)
})

for (const platform of ['ios', 'web', 'android']) {
  test(`La política Android ${platform === 'android' ? 'bloquea Android antiguo' : `no bloquea ${platform}`}`, async () => {
    const states = []
    let reads = 0
    const code = loadSource('components/ForceUpdateGate.tsx', {
      'react/jsx-runtime': {},
      react: {
        useState(initial) {
          const index = states.length
          states.push(initial)
          return [initial, value => { states[index] = value }]
        },
        useEffect(effect) { effect() },
      },
      '@capacitor/core': { Capacitor: { getPlatform: () => platform } },
      '@capacitor/app': { App: { async getInfo() {
        reads++
        return { build: '1', version: '1.0.37' }
      } } },
      '@/components/ui/button': {},
      'lucide-react': {},
      '@/lib/forceUpdateConfig': { async fetchPublicAndroidMinVersion() { reads++; return 37 } },
      '@/lib/appVersion': { ANDROID_VERSION_CODE: 37 },
    })
    code.useForceUpdateRequired({ minAndroidVersionCode: 37 }, false)
    await flush()
    assert.equal(states[0], false, 'Debe finalizar la comprobación')
    assert.equal(states[1], platform === 'android')
    assert.equal(reads, platform === 'android' ? 2 : 0)
  })
}

test('El token emitido inmediatamente al registrar push se guarda como FCM', async () => {
  const listeners = new Map()
  const removed = []
  const writes = []
  let cleanup
  const code = loadSource('hooks/usePushNotifications.ts', {
    react: {
      useEffect(effect) { cleanup = effect() },
      useRef: current => ({ current }),
    },
    '@capacitor/core': { Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' } },
    'firebase/firestore': {
      doc: (...args) => args,
      arrayUnion: value => [value],
      async setDoc(...args) { writes.push(args) },
    },
    '@/lib/firebase': { db: {} },
    '@/lib/pushNotifications': {},
    '@capacitor/push-notifications': { PushNotifications: {
      async checkPermissions() { return { receive: 'granted' } },
      async addListener(name, callback) {
        listeners.set(name, callback)
        return { async remove() { removed.push(name) } }
      },
      async register() {
        assert.ok(listeners.has('registrationError'))
        listeners.get('registration')({ value: 'test-fcm-token' })
      },
    } },
  })
  code.usePushNotifications('user-id')
  await flush()
  assert.equal(writes.length, 1)
  assert.equal(writes[0][1].fcmToken, 'test-fcm-token')
  assert.equal(writes[0][1].fcmPlatform, 'ios')
  cleanup()
  await flush()
  assert.equal(removed.length, 4)
})

test('Desmontar durante la instalación de listeners no deja listeners ni registra push', async () => {
  let cleanup
  let releaseListener
  let removed = 0
  let registered = false
  const code = loadSource('hooks/usePushNotifications.ts', {
    react: {
      useEffect(effect) { cleanup = effect() },
      useRef: current => ({ current }),
    },
    '@capacitor/core': { Capacitor: { isNativePlatform: () => true } },
    'firebase/firestore': {},
    '@/lib/firebase': {},
    '@/lib/pushNotifications': {},
    '@capacitor/push-notifications': { PushNotifications: {
      async checkPermissions() { return { receive: 'granted' } },
      addListener() {
        if (!releaseListener) {
          return new Promise(resolve => {
            releaseListener = () => resolve({ async remove() { removed++ } })
          })
        }
        return Promise.resolve({ async remove() { removed++ } })
      },
      async register() { registered = true },
    } },
  })
  code.usePushNotifications('user-id')
  await flush()
  cleanup()
  releaseListener()
  await flush()
  assert.equal(registered, false)
  assert.equal(removed, 4)
})

test('Google exige el cliente iOS solamente en iOS y reutiliza la inicialización', async () => {
  for (const platform of ['android', 'ios']) {
    const calls = []
    const code = loadSource('lib/initGoogleAuthNative.ts', {
      '@capacitor/core': { Capacitor: { isNativePlatform: () => true, getPlatform: () => platform } },
      '@capgo/capacitor-social-login': { SocialLogin: { async initialize(options) { calls.push(options) } } },
      '@/lib/googleAuthConfig': {
        assertGoogleWebClientId: () => 'web-client',
        assertGoogleIOSClientId() {
          assert.equal(platform, 'ios')
          return 'ios-client'
        },
      },
    })
    await Promise.all([code.initializeGoogleAuthNative(), code.initializeGoogleAuthNative()])
    assert.equal(calls.length, 1)
    assert.equal(calls[0].google.webClientId, 'web-client')
    assert.equal(calls[0].google.iOSClientId, platform === 'ios' ? 'ios-client' : undefined)
  }
})

test('Falta de cliente Google iOS produce un error de configuración claro', () => {
  const code = loadSource('lib/googleAuthConfig.ts', {})
  assert.throws(() => code.assertGoogleIOSClientId(), /NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID/)
})
