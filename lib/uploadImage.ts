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
  if (file.size >= MAX_SIZE) {
    throw new Error('La imagen debe pesar menos de 5 MiB.')
  }

  // Generar nombre único para evitar colisiones
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${path}_${Date.now()}.${extension}`
  const storageRef = ref(storage, fileName)

  let operation = 'subir la foto'
  try {
    await uploadBytes(storageRef, file, { contentType: file.type })
    operation = 'obtener el enlace de la foto'
    return await getDownloadURL(storageRef)
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    console.error('[Storage]', { operation, code, size: file.size, contentType: file.type })
    if (code === 'storage/unauthenticated') {
      throw new Error('Volvé a iniciar sesión antes de subir fotos.')
    }
    if (code === 'storage/unauthorized') {
      throw new Error(`Firebase denegó el permiso para ${operation}. (${code})`)
    }
    if (code === 'storage/retry-limit-exceeded') {
      throw new Error(`Se agotó el tiempo al intentar ${operation}. (${code})`)
    }
    throw error
  }
}
