# Preparación de Punto Encuentro para iOS

## Estado de esta primera etapa

- Plataforma `ios/` generada con Capacitor iOS 7.4.3, igual que el core instalado.
- Bundle ID `com.encuentro12`, versión comercial `1.0.37`, build iOS inicial `1`.
- Deployment target iOS 15.0, requerido por Firebase Messaging 12.
- Permisos de ubicación, cámara, fotos y micrófono con explicación en español.
- Esquema `com.encuentro12` para volver desde Mercado Pago.
- Google preparado para `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID` y retorno nativo.
- Puente nativo de APNs a FCM para conservar el envío existente del backend.
- La política de actualización de Google Play se aplica solamente a Android.

La creación y sincronización desde Windows NO compilan Swift ni instalan Pods.
La app todavía requiere configuración real de Firebase/Apple y pruebas en iPhone.
Los iconos y la pantalla de inicio de iOS son los de la plantilla de Capacitor;
deben reemplazarse antes de publicar. No se ha generado un IPA ni se ha publicado.

## 1. Registrar la app iOS en Firebase (se puede hacer desde Windows)

En el proyecto Firebase existente `punto-encuentro-aa7a2`, agregar una aplicación
Apple con bundle ID `com.encuentro12`. No crear otra base de datos: se comparten
usuarios, Firestore, Storage y Functions con Android.

El archivo `GoogleService-Info.plist` recibido el 23 de noviembre de 2026 ya está
integrado localmente en `ios/App/App/` y en los recursos del target **App**.
El cliente Google iOS está configurado en `.env.local` y su esquema de retorno
en Debug y Release. Estos archivos locales de configuración están ignorados por Git.

Habilitar Google en Authentication. Del plist obtener:

- `CLIENT_ID`: ponerlo en `.env.local` como `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
- `REVERSED_CLIENT_ID`: ponerlo en el ajuste de compilación
  `GOOGLE_REVERSED_CLIENT_ID` del target App, en Debug y Release. Reemplaza
  `com.googleusercontent.apps.CONFIGURE_IOS_CLIENT_ID`.

No confundir el cliente OAuth de iOS con el cliente Web ni con el de Android.
La variable `NEXT_PUBLIC_...` se incorpora al JavaScript durante `next build`:
modificarla requiere volver a construir y sincronizar.

## 2. Compilar y sincronizar desde Windows

Ejecutar en la carpeta que contiene `package.json`:

```powershell
npm ci --legacy-peer-deps
npm run build:ios
```

`--legacy-peer-deps` es necesario por el conflicto ya existente entre
`vaul@0.9.9` y React 19. No se ha actualizado la biblioteca de componentes en
esta etapa. Usar npm con `package-lock.json` para reproducir esta instalación.

`build:ios` genera `out/` y copia los recursos y la configuración a iOS.
Windows mostrará avisos por ausencia de CocoaPods y Xcode; no son una validación
de compilación nativa. `build:android` sincroniza exclusivamente Android.

### Compilación con Codemagic

El workflow `ios-release` de `codemagic.yaml` genera un IPA con firma App Store.
Se debe subir el código a GitHub para que Codemagic pueda obtenerlo.

En Codemagic, crear el grupo de variables `ios_configuration` y agregar
`GOOGLE_SERVICE_INFO_PLIST_BASE64` como variable segura. El valor está preparado
localmente en `.cache/GoogleService-Info.plist.base64.txt`. Se copia el contenido
completo del archivo en el valor de la variable.

Configurar en el equipo de Codemagic un certificado de distribución y un perfil
App Store para `com.encuentro12`, correspondientes al equipo Apple propietario.
El workflow los obtiene mediante `ios_signing`.

Al ejecutar el build, el script Python valida el proyecto, el bundle y el cliente
OAuth del plist. Luego exporta los IDs para la compilación web. El script Ruby
incorpora el plist al target, genera el scheme compartido App y toma la versión
de `package.json` y el número de build de Codemagic.

La configuración actual conserva el IPA como artefacto descargable. La publicación
en App Store Connect y TestFlight requiere configurar posteriormente ese destino.

## 3. Completar en macOS local o remoto

Hace falta un entorno macOS con Xcode, herramientas de línea de comandos,
Node.js y CocoaPods. Actualmente App Store Connect exige como mínimo Xcode 26
y SDK de iOS 26 para los envíos; el deployment target puede ser iOS 15.

```bash
npm ci --legacy-peer-deps
npm run build:ios
npm run open:ios
```

Abrir `ios/App/App.xcworkspace`, no solamente el `.xcodeproj`.
En **Signing & Capabilities**, elegir el equipo de Apple Developer y comprobar
que el bundle ID esté registrado/disponible en ese equipo.

Confirmar el recurso Firebase y `GOOGLE_REVERSED_CLIENT_ID` del paso 1.
El proyecto incluye el entitlement de Push Notifications para desarrollo.
La firma de distribución debe usar un perfil que habilite APNs de producción;
comprobar los entitlements del archivo archivado antes de subirlo.

## 4. Notificaciones

Crear una clave APNs en Apple Developer y subirla a Firebase → Configuración
del proyecto → Cloud Messaging → aplicación Apple, con Key ID y Team ID.
No guardar la clave privada `.p8` en el repositorio.

`AppDelegate.swift` configura Firebase nativo si el plist está incluido, asigna
el token APNs a Firebase Messaging y publica el **token FCM** a Capacitor.
No reemplazar este registro por el ejemplo estándar que publica `deviceToken`
directamente: el backend actual necesita FCM, no APNs.

El auto-init y el swizzling de Firebase se deshabilitan en `Info.plist`;
el registro se solicita desde el hook después del permiso del usuario.
El AppDelegate habilita FCM y obtiene su token después de recibir APNs.
Los cambios de token se vuelven a publicar al hook.

El hook instala listeners antes de `register()` y guarda el token en los campos
FCM existentes de Firestore. Las Functions incluyen sonido para APNs. Estos
cambios del servidor requieren un despliegue posterior autorizado:

```bash
npm run deploy:functions
```

No se ha ejecutado ese despliegue durante esta preparación.
Las imágenes de las notificaciones en iOS requieren una Notification Service
Extension adicional; no forma parte de esta primera etapa.

## 5. Verificación en iPhone antes de TestFlight

- Acceso con email y Google, cancelación de Google y sesión tras reiniciar.
- GPS concedido, denegado y cambio posterior en Ajustes.
- Fotos, videos y los permisos usados por cada flujo.
- Chat y asistente con teclado abierto, notch, barra inferior y rotación.
- Push con app abierta, en segundo plano y cerrada; tocar el aviso debe abrir
  la pantalla correcta. Verificar token FCM y renovación tras reinstalar.
- Mercado Pago: conectar cuenta, regresar desde OAuth y completar/cancelar
  un pago. Probar también el retorno cuando la app estaba cerrada.
- Comprobar que una versión mínima de Android alta no bloquee iOS.

## 6. Pendientes de publicación

- Sign in with Apple u otra alternativa que cumpla la regla 4.8 aplicable.
- Flujo de eliminación de cuenta iniciado por el usuario y manejo de sus datos.
- Privacidad, declaraciones de datos y revisión de manifests de los SDK.
- Moderación, reportes y bloqueo correspondientes al contenido/chat.
- Icono, splash, capturas, ficha de App Store y cuenta de revisión.
- Política de actualización específica de iOS cuando exista su ficha de tienda.
- Corregir los errores TypeScript existentes: el build de Next actualmente
  omite esa comprobación por configuración del proyecto.

Para trabajar sin Mac propia, se puede usar una Mac remota o un servicio CI con
macOS. La elección del servicio, credenciales de firma y publicación queda
pendiente; todavía no se ha configurado ningún proveedor externo.

## Verificaciones ejecutadas en Windows

- `npm run build:ios`: exportación web y sincronización completadas.
- `npm run test:ios`: 7 pruebas del código compartido aprobadas.
- `node --check functions/index.js` y `node --check functions/reminders.js`: sin errores de sintaxis.
- `Info.plist` y `App.entitlements`: XML válido.
- TypeScript: quedan 37 errores en `app/page.tsx`, `AdminDashboard.tsx`,
  `BookingPayments.tsx` y `useServices.ts`. No hubo errores en los archivos
  adaptados para iOS. Se corrigió el tipo de `KeyboardResize` en Capacitor.
- No se ejecutaron CocoaPods, Xcode, firma, simulador ni pruebas en dispositivo.

## Referencias oficiales

- https://capacitorjs.com/docs/v7/ios
- https://capacitorjs.com/docs/v7/apis/push-notifications
- https://firebase.google.com/docs/cloud-messaging/ios/client
- https://capgo.app/docs/plugins/social-login/google/ios/
- https://developer.apple.com/news/upcoming-requirements/?id=04282026a
- https://developer.apple.com/app-store/review/guidelines/
