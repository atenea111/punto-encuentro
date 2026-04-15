#!/bin/bash

# Script para verificar el SHA1 de un keystore
# Uso: ./scripts/verify-keystore.sh <ruta-keystore> <alias> <password>

KEYSTORE_PATH=$1
KEY_ALIAS=$2
STORE_PASSWORD=$3

if [ -z "$KEYSTORE_PATH" ] || [ -z "$KEY_ALIAS" ] || [ -z "$STORE_PASSWORD" ]; then
    echo "Uso: $0 <ruta-keystore> <alias> <password>"
    echo "Ejemplo: $0 android/app/punto-encuentro-release.keystore punto-encuentro-key puntoencuentro2024"
    exit 1
fi

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "Error: El keystore no existe en: $KEYSTORE_PATH"
    exit 1
fi

echo "Verificando keystore: $KEYSTORE_PATH"
echo "Alias: $KEY_ALIAS"
echo ""

SHA1=$(keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$KEY_ALIAS" -storepass "$STORE_PASSWORD" 2>/dev/null | grep -i "SHA1" | sed 's/.*SHA1: //')

if [ -z "$SHA1" ]; then
    echo "Error: No se pudo obtener el SHA1. Verifica el alias y la contraseña."
    exit 1
fi

echo "SHA1 del keystore: $SHA1"
echo ""
echo "SHA1 esperado por Google Play: 34:A1:69:FD:6E:CF:5B:12:35:CC:1E:0C:8F:2A:A3:BB:42:0B:2E:6F"
echo ""

if [ "$SHA1" = "34:A1:69:FD:6E:CF:5B:12:35:CC:1E:0C:8F:2A:A3:BB:42:0B:2E:6F" ]; then
    echo "✅ El keystore es CORRECTO y coincide con Google Play Console"
else
    echo "❌ El keystore NO coincide con el esperado por Google Play Console"
fi
