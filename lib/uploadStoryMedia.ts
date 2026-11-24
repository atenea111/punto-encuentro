import { uploadFile } from '@/lib/firebase'

const MAX_STORY_MEDIA_SIZE = 20 * 1024 * 1024

export type StoryMediaType = 'image' | 'video'

export async function uploadStoryMedia(file: File, path: string): Promise<{ url: string; mediaType: StoryMediaType }> {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  if (!isImage && !isVideo) {
    throw new Error('El archivo seleccionado debe ser una imagen o un video')
  }

  if (file.size > MAX_STORY_MEDIA_SIZE) {
    throw new Error('El archivo es demasiado grande. Máximo 20 MB')
  }

  const extension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
  const mediaType: StoryMediaType = isVideo ? 'video' : 'image'
  const folder = path.replace(/\/$/, '')
  const uploadPath = `${folder}/${Date.now()}.${extension}`
  const url = await uploadFile(file, uploadPath)

  return { url, mediaType }
}
