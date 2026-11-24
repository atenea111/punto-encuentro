"""Prepara la configuración de Firebase recibida por Codemagic."""
import base64
import os
import pathlib
import plistlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PLIST_PATH = ROOT / "ios/App/App/GoogleService-Info.plist"


def configuration():
    encoded = os.environ.get("GOOGLE_SERVICE_INFO_PLIST_BASE64", "").strip()
    if encoded:
        raw = base64.b64decode("".join(encoded.split()), validate=True)
    elif PLIST_PATH.is_file():
        raw = PLIST_PATH.read_bytes()
    else:
        raise ValueError(
            "Falta GOOGLE_SERVICE_INFO_PLIST_BASE64 en el grupo "
            "ios_configuration de Codemagic."
        )
    values = plistlib.loads(raw)
    if values.get("BUNDLE_ID") != "com.encuentro12":
        raise ValueError("El plist debe pertenecer al bundle com.encuentro12.")
    if values.get("PROJECT_ID") != "punto-encuentro-aa7a2":
        raise ValueError("El plist debe pertenecer al proyecto punto-encuentro-aa7a2.")
    client_id = values.get("CLIENT_ID", "")
    if not re.fullmatch(r"[A-Za-z0-9-]+\.apps\.googleusercontent\.com", client_id):
        raise ValueError("El plist necesita CLIENT_ID del cliente OAuth de iOS.")
    reversed_id = ".".join(reversed(client_id.split(".")))
    if values.get("REVERSED_CLIENT_ID") != reversed_id:
        raise ValueError("REVERSED_CLIENT_ID no corresponde al CLIENT_ID del plist.")
    return raw, client_id, reversed_id


def main():
    raw, client_id, reversed_id = configuration()
    if "--check" in sys.argv:
        print("Configuración Firebase iOS válida.")
        return
    env_file = os.environ.get("CM_ENV")
    if not env_file:
        raise ValueError("Este script se ejecuta en Codemagic. Para validar usá --check.")
    PLIST_PATH.write_bytes(raw)
    with open(env_file, "a", encoding="utf-8") as output:
        output.write("NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID=" + client_id + "\n")
        output.write("GOOGLE_REVERSED_CLIENT_ID=" + reversed_id + "\n")
    print("Firebase iOS preparado para la compilación.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, plistlib.InvalidFileException) as error:
        sys.exit(str(error))
