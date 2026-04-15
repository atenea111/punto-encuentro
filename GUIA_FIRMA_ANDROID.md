# Guía de Firma de Aplicación Android

## 🔍 Situación Actual

### SHA1 del Keystore
- **Keystore correcto**: `my-release-key.jks`
- **SHA1 del keystore**: `34:A1:69:FD:6E:CF:5B:12:35:CC:1E:0C:8F:2A:A3:BB:42:0B:2E:6F`
- **SHA1 esperado por Google Play**: `34:A1:69:FD:6E:CF:5B:12:35:CC:1E:0C:8F:2A:A3:BB:42:0B:2E:6F`

**✅ Estado**: El keystore `my-release-key.jks` es CORRECTO y coincide con Google Play Console.

### Configuración Actual
- **Archivo keystore**: `android/app/my-release-key.jks`
- **Alias**: `my-key-alias`
- **Contraseña**: Configurada en `gradle.properties`

## 📋 Proceso Recomendado

### Paso 1: Traer Cambios del Repositorio

```bash
# Asegúrate de estar en la rama correcta
git checkout main  # o la rama que corresponda

# Traer cambios remotos
git pull origin main

# Verificar si hay conflictos
git status
```

### Paso 2: Localizar el Keystore Correcto

El keystore correcto debe tener el SHA1: `34:A1:69:FD:6E:CF:5B:12:35:CC:1E:0C:8F:2A:A3:BB:42:0B:2E:6F`

**Opciones:**
1. **Si el keystore correcto está en otro lugar**: 
   - Busca en backups, otros equipos, o documentación del equipo
   - Verifica si está en variables de entorno o servicios de secretos

2. **Si necesitas usar el keystore actual pero Google Play espera otro**:
   - Esto significa que la app ya fue publicada con otro keystore
   - **IMPORTANTE**: No puedes cambiar el keystore de una app ya publicada en Google Play
   - Debes usar el keystore original que se usó para la primera publicación

3. **Si es una app nueva o puedes cambiar el keystore**:
   - Puedes crear un nuevo keystore, pero esto requiere actualizar la configuración en Google Play Console

### Paso 3: Verificar el SHA1 del Keystore

Usa el script proporcionado para verificar:

**Windows:**
```bash
scripts\verify-keystore.bat android\app\punto-encuentro-release.keystore punto-encuentro-key puntoencuentro2024
```

**Linux/Mac:**
```bash
chmod +x scripts/verify-keystore.sh
./scripts/verify-keystore.sh android/app/punto-encuentro-release.keystore punto-encuentro-key puntoencuentro2024
```

O manualmente:
```bash
keytool -list -v -keystore android/app/punto-encuentro-release.keystore -alias punto-encuentro-key -storepass puntoencuentro2024
```

### Paso 4: Actualizar Configuración (si es necesario)

Si encuentras el keystore correcto en otra ubicación, actualiza:

**`android/app/build.gradle`:**
```gradle
signingConfigs {
    release {
        storeFile file('ruta/al/keystore-correcto.keystore')
        storePassword project.findProperty('RELEASE_STORE_PASSWORD') ?: System.getenv('RELEASE_STORE_PASSWORD') ?: 'tu-password'
        keyAlias project.findProperty('RELEASE_KEY_ALIAS') ?: System.getenv('RELEASE_KEY_ALIAS') ?: 'tu-alias'
        keyPassword project.findProperty('RELEASE_KEY_PASSWORD') ?: System.getenv('RELEASE_KEY_PASSWORD') ?: 'tu-password'
    }
}
```

**`android/gradle.properties`:**
```properties
RELEASE_STORE_PASSWORD=tu-password
RELEASE_KEY_ALIAS=tu-alias
RELEASE_KEY_PASSWORD=tu-password
```

### Paso 5: Generar el AAB Firmado

```bash
# Navegar a la carpeta android
cd android

# Limpiar builds anteriores
./gradlew clean

# Generar el AAB firmado
./gradlew bundleRelease

# El AAB estará en: android/app/build/outputs/bundle/release/app-release.aab
```

### Paso 6: Verificar el SHA1 del AAB Generado

```bash
# Extraer y verificar el certificado del AAB
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab | grep -i "SHA1"
```

O usar `bundletool`:
```bash
bundletool verify --bundle=android/app/build/outputs/bundle/release/app-release.aab
```

## ⚠️ Consideraciones Importantes

1. **Seguridad del Keystore**:
   - El keystore es crítico para actualizar tu app en Google Play
   - Si lo pierdes, NO podrás actualizar la app
   - Guarda copias de seguridad en lugares seguros
   - Considera usar variables de entorno para las contraseñas

2. **No Cambiar el Keystore de una App Publicada**:
   - Si la app ya está en Google Play, DEBES usar el mismo keystore
   - Google Play no permite cambiar el keystore de una app existente

3. **Versionado**:
   - Asegúrate de incrementar `versionCode` en `build.gradle` antes de generar el AAB
   - Actual: `versionCode 5`, `versionName "1.0.5"`

## 📝 Archivos Modificados Detectados

Según el estado de Git, estos archivos están modificados:
- `android/capacitor.settings.gradle`
- `android/gradle.properties`
- `android/app/build.gradle`
- `android/app/capacitor.build.gradle`
- `android/app/punto-encuentro-release.keystore` (untracked)

**Recomendación**: Revisa estos cambios antes de hacer commit para asegurarte de que la configuración de firma sea correcta.

## 🔧 Solución de Problemas

### Si no encuentras el keystore correcto:
1. Revisa backups del proyecto
2. Consulta con otros miembros del equipo
3. Revisa documentación o notas del proyecto
4. Si la app ya está publicada, contacta con Google Play Support

### Si el SHA1 sigue sin coincidir:
1. Verifica que estés usando el keystore correcto
2. Verifica el alias de la clave
3. Asegúrate de que las contraseñas sean correctas
4. Verifica que el AAB se haya firmado correctamente
