import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

/**
 * Sube una imagen a Firebase Storage y devuelve la URL pública.
 *
 * @param file - El archivo de imagen a subir
 * @param path - Ruta dentro de Storage (ej: "services/abc123" o "profiles/uid")
 * @returns URL de descarga de la imagen subida
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida')
  }

  // Validar tamaño (máximo 5 MB)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error('La imagen es demasiado grande. Máximo 5 MB')
  }

  // Generar nombre único para evitar colisiones
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${path}_${Date.now()}.${extension}`
  const storageRef = ref(storage, fileName)

  // Subir
  await uploadBytes(storageRef, file)

  // Obtener URL pública
  const downloadURL = await getDownloadURL(storageRef)
  return downloadURL
}
