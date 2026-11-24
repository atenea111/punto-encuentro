import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, Clock, Eye, MapPin, MessageCircle, Plus, Send, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Story, StoryCtaType, filterStoriesForCity, normalizeLocationKey, recordStoryCtaClick, recordStoryReply, recordStoryView, useStories } from '@/hooks/useStories'
import { useGeolocation } from '@/hooks/useGeolocation'
import { uploadStoryMedia } from '@/lib/uploadStoryMedia'
import { AppIcon } from '@/components/AppIcon'

type StoryActionHandler = (story: Story) => void | Promise<void>
type StoryReplyHandler = (story: Story, message: string) => Promise<{ success: boolean; error?: string } | void>

const QUICK_REPLIES = ['¿Cuál es el precio?', '¿Tenés disponibilidad?', 'Quiero reservar', 'Quiero más información']

const STORIES_LIMIT_PROMO_DISMISS_KEY = 'pe_stories_10_promo_dismissed'

/** Aviso temporal: límite ampliado a 10 historias/día. Se oculta al cerrar con X. */
export function StoriesLimitPromoBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setVisible(localStorage.getItem(STORIES_LIMIT_PROMO_DISMISS_KEY) !== '1')
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORIES_LIMIT_PROMO_DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-orange-50 to-pink-50 p-4 pr-11 shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:bg-white/80 hover:text-gray-800"
        aria-label="Cerrar aviso"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 items-start">
        <div className="p-2 rounded-xl bg-primary/15 text-primary flex-shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">¡Buenas noticias para tu negocio!</p>
          <p className="text-xs text-gray-700 mt-1 leading-relaxed">
            Por las molestias, habilitamos <strong>10 historias por día</strong> (antes eran 5) para que sigas mostrando tu trabajo en tu zona.
          </p>
        </div>
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'ahora'
  if (diffMinutes < 60) return `hace ${diffMinutes} min`
  if (diffHours < 24) return `hace ${diffHours} h`
  return `hace ${diffDays} d`
}

function getPreviewLabel(story: Story) {
  if (story.ctaType === 'booking') return 'Reservar'
  if (story.ctaType === 'contact') return 'Contactar'
  if (story.ctaType === 'service') return 'Ver servicio'
  return 'Abrir'
}

function getStoryLinkInfo(story: Story) {
  if (story.ctaType === 'booking') {
    return {
      title: story.serviceName || 'Reservar turno',
      subtitle: 'Llamado a la acción: reservar turno',
    }
  }

  if (story.ctaType === 'contact') {
    return {
      title: 'Contactar',
      subtitle: story.ctaTarget || 'Canal de contacto',
    }
  }

  return {
    title: story.serviceName || story.providerName,
    subtitle: story.category || story.city,
  }
}

function StoryMedia({ story }: { story: Story }) {
  if (story.mediaType === 'video') {
    return (
      <video
        key={story.id}
        src={story.mediaUrl}
        className="w-full h-full object-cover"
        controls={false}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
      />
    )
  }

  return (
    <img
      key={story.id}
      src={story.mediaUrl}
      alt={story.caption || story.providerName}
      className="w-full h-full object-cover"
      decoding="async"
      fetchPriority="high"
    />
  )
}

function preloadStoryMedia(story?: Story | null) {
  if (!story?.mediaUrl || typeof window === 'undefined') return
  if (story.mediaType === 'video') {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.src = story.mediaUrl
    return
  }
  const img = new Image()
  img.decoding = 'async'
  img.src = story.mediaUrl
}

type ProviderStoryGroup = {
  providerId: string
  providerName: string
  providerImage: string
  city: string
  stories: Story[]
}

function groupStoriesByProvider(stories: Story[]): ProviderStoryGroup[] {
  const groups = new Map<string, Story[]>()

  for (const story of stories) {
    const key = story.providerId || story.id
    const list = groups.get(key) || []
    list.push(story)
    groups.set(key, list)
  }

  return Array.from(groups.entries())
    .map(([providerId, groupStories]) => {
      const chronological = [...groupStories].sort(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
      )
      const latest = chronological[chronological.length - 1]
      return {
        providerId,
        providerName: latest.providerName,
        providerImage:
          latest.providerImage ||
          (latest.mediaType === 'image' ? latest.mediaUrl : '/placeholder.svg'),
        city: latest.city,
        stories: chronological,
        latestAt: latest.createdAt.getTime(),
      }
    })
    .sort((left, right) => right.latestAt - left.latestAt)
    .map(({ latestAt: _latestAt, ...group }) => group)
}

function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
  onStoryAction,
  onStoryReply,
}: {
  groups: ProviderStoryGroup[]
  initialGroupIndex: number
  onClose: () => void
  onStoryAction?: StoryActionHandler
  onStoryReply?: StoryReplyHandler
}) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex)
  const [activeIndex, setActiveIndex] = useState(0)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [replyError, setReplyError] = useState('')
  const seenStories = useRef<Set<string>>(new Set())

  const currentGroup = groups[groupIndex]
  const stories = currentGroup?.stories || []
  const activeStory = stories[activeIndex]
  const nextInGroup = stories[activeIndex + 1]
  const nextGroupFirst = groups[groupIndex + 1]?.stories?.[0]

  useEffect(() => {
    setGroupIndex(initialGroupIndex)
    setActiveIndex(0)
    setReplyText('')
    setReplyError('')
  }, [initialGroupIndex])

  useEffect(() => {
    const story = activeStory
    if (!story || seenStories.current.has(story.id)) return
    seenStories.current.add(story.id)
    recordStoryView(story.id)
  }, [activeStory?.id])

  // Prefetch de la siguiente historia (mismo proveedor o siguiente grupo).
  useEffect(() => {
    preloadStoryMedia(nextInGroup || nextGroupFirst || null)
  }, [nextInGroup?.id, nextGroupFirst?.id])

  const goToNext = () => {
    if (activeIndex < stories.length - 1) {
      setActiveIndex((current) => current + 1)
      return
    }
    if (groupIndex < groups.length - 1) {
      setGroupIndex((current) => current + 1)
      setActiveIndex(0)
      setReplyText('')
      setReplyError('')
      return
    }
    onClose()
  }

  const goToPrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex((current) => current - 1)
      return
    }
    if (groupIndex > 0) {
      const previousStories = groups[groupIndex - 1]?.stories || []
      setGroupIndex((current) => current - 1)
      setActiveIndex(Math.max(previousStories.length - 1, 0))
      setReplyText('')
      setReplyError('')
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') goToNext()
      if (event.key === 'ArrowLeft') goToPrevious()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, groupIndex, stories.length, groups.length, onClose])

  if (!activeStory) return null

  const handleAction = async () => {
    void recordStoryCtaClick(activeStory.id)
    await onStoryAction?.(activeStory)
  }

  const handleReply = async (message?: string) => {
    const finalMessage = (message || replyText).trim()
    if (!finalMessage || !onStoryReply || replying) return

    setReplying(true)
    setReplyError('')
    const result = await onStoryReply(activeStory, finalMessage)
    if (result && !result.success) {
      setReplyError(result.error || 'No se pudo enviar la respuesta.')
      setReplying(false)
      return
    }
    void recordStoryReply(activeStory.id)
    setReplyText('')
    setReplying(false)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 text-white">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{activeStory.providerName}</p>
          <p className="text-[11px] text-white/70 truncate">{activeStory.city}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pb-3 flex gap-1">
        {stories.map((story, index) => (
          <div
            key={story.id}
            className={`h-1 flex-1 rounded-full ${index <= activeIndex ? 'bg-white' : 'bg-white/25'}`}
          />
        ))}
      </div>

      <div className="relative flex-1 mx-3 mb-4 rounded-[2rem] overflow-hidden bg-zinc-900">
        <button
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 text-white"
          aria-label="Story anterior"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 text-white"
          aria-label="Story siguiente"
        >
          <ArrowRight className="h-5 w-5" />
        </button>

        <StoryMedia story={activeStory} />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-white/15 text-white border-white/10">{activeStory.city}</Badge>
            <span className="text-[11px] text-white/70">{formatTimeAgo(activeStory.createdAt)}</span>
          </div>

          <p className="text-sm leading-relaxed line-clamp-3">
            {activeStory.caption || 'Historia promocional'}
          </p>

          {activeStory.ctaType !== 'none' && (
            <Button onClick={handleAction} className="mt-4 w-full rounded-xl h-11 font-semibold">
              {getPreviewLabel(activeStory)}
            </Button>
          )}

          {onStoryReply && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {QUICK_REPLIES.map((reply) => (
                  <button key={reply} type="button" disabled={replying} onClick={() => handleReply(reply)} className="flex-shrink-0 rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
                    {reply}
                  </button>
                ))}
              </div>
              <form onSubmit={(event) => { event.preventDefault(); void handleReply() }} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Responder historia..." maxLength={300} className="h-11 rounded-full border-white/25 bg-black/30 pl-9 pr-3 text-white placeholder:text-white/55" />
                </div>
                <Button type="submit" size="icon" disabled={!replyText.trim() || replying} className="h-11 w-11 rounded-full flex-shrink-0" aria-label="Enviar respuesta">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {replyError && <p className="text-xs text-red-300">{replyError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function StoriesShelf({
  cityCandidates,
  onStoryAction,
  onStoryReply,
  onConfigureLocation,
  title = 'Historias de tu zona',
}: {
  cityCandidates: Array<string | null | undefined>
  onStoryAction?: StoryActionHandler
  onStoryReply?: StoryReplyHandler
  onConfigureLocation?: () => void
  title?: string
}) {
  const { activeStories, loading } = useStories()
  const [viewerGroupIndex, setViewerGroupIndex] = useState<number | null>(null)

  const resolvedCity = useMemo(() => {
    for (const candidate of cityCandidates) {
      const value = String(candidate || '').trim()
      if (normalizeLocationKey(value)) return value
    }
    return ''
  }, [cityCandidates])

  const stories = useMemo(
    () => filterStoriesForCity(activeStories, resolvedCity),
    [activeStories, resolvedCity]
  )
  const providerGroups = useMemo(() => groupStoriesByProvider(stories), [stories])
  const providerCount = providerGroups.length

  // Prefetch miniaturas / primer media de cada proveedor visible.
  useEffect(() => {
    providerGroups.slice(0, 8).forEach((group) => {
      preloadStoryMedia(group.stories[0])
    })
  }, [providerGroups])

  if (!resolvedCity) {
    return (
      <Card className="border-dashed bg-white/70">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configurá tu ciudad para ver historias de Rosario, Córdoba, Buenos Aires, etc.
              </p>
              {onConfigureLocation && (
                <Button variant="outline" className="mt-3" onClick={onConfigureLocation}>
                  Configurar ubicación
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border-dashed bg-white/70">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stories.length === 0) {
    return (
      <Card className="border-dashed bg-white/70">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Aún no hay historias activas en {resolvedCity}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {resolvedCity} · {stories.length} historias · {providerCount} comercios
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          24 h
        </Badge>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {providerGroups.map((group, index) => (
          <button
            key={group.providerId}
            onClick={() => setViewerGroupIndex(index)}
            className="flex flex-col items-center gap-2 min-w-[76px]"
          >
            <div className="relative w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-primary via-orange-400 to-pink-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                  <img
                    src={group.providerImage || '/placeholder.svg'}
                    alt={group.providerName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {group.stories.length > 1 && (
                <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {group.stories.length}
                </span>
              )}
            </div>
            <div className="text-center w-full">
              <p className="text-[11px] font-semibold text-gray-800 truncate">{group.providerName}</p>
              <p className="text-[10px] text-gray-400 truncate">{group.city}</p>
            </div>
          </button>
        ))}
      </div>

      {viewerGroupIndex !== null && providerGroups[viewerGroupIndex] && (
        <StoryViewer
          groups={providerGroups}
          initialGroupIndex={viewerGroupIndex}
          onClose={() => setViewerGroupIndex(null)}
          onStoryAction={onStoryAction}
          onStoryReply={onStoryReply}
        />
      )}
    </div>
  )
}

export function ProviderStoriesManager({
  user,
  services,
  setFlow,
}: {
  user: any
  services: any[]
  setFlow: (flow: string) => void
}) {
  const { position } = useGeolocation()
  const { stories, storiesDailyLimit, createStory, getStoriesByProvider, getRemainingStoriesToday, toggleStoryActive, deleteStory } = useStories()
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active')
  const [profileCity, setProfileCity] = useState('')
  const [storyForm, setStoryForm] = useState({
    city: '',
    caption: '',
    ctaType: 'service' as StoryCtaType,
    ctaTarget: '',
  })
  const [selectedItems, setSelectedItems] = useState<Array<{
    file: File
    previewUrl: string
    mediaType: 'image' | 'video'
  }>>([])
  const selectedItemsRef = useRef(selectedItems)
  selectedItemsRef.current = selectedItems

  const providerServices = useMemo(
    () => services.filter((service: any) => service.providerId === user?.uid),
    [services, user?.uid]
  )
  const providerStories = useMemo(
    () => getStoriesByProvider(user?.uid || ''),
    [getStoriesByProvider, user?.uid]
  )

  const cityFallback = useMemo(() => {
    const candidate = providerServices[0]?.city || profileCity || position?.city || position?.address || ''
    return candidate
  }, [position, profileCity, providerServices])

  useEffect(() => {
    const loadProfileCity = async () => {
      if (!user?.uid) return
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data.city) {
            setProfileCity(String(data.city))
          }
        }
      } catch (error) {
        console.error('Error loading provider city:', error)
      }
    }

    loadProfileCity()
  }, [user])

  useEffect(() => {
    if (!storyForm.city) {
      setStoryForm((current) => ({
        ...current,
        city: cityFallback || '',
      }))
    }
  }, [providerServices, cityFallback])

  const remainingToday = getRemainingStoriesToday(user?.uid || '')
  const todaysStories = providerStories.filter((story) => {
    const now = new Date()
    return (
      story.createdAt.getFullYear() === now.getFullYear() &&
      story.createdAt.getMonth() === now.getMonth() &&
      story.createdAt.getDate() === now.getDate()
    )
  }).length

  const activeStories = providerStories.filter((story) => story.active && story.expiresAt.getTime() > Date.now())
  const expiredStories = providerStories.filter((story) => !story.active || story.expiresAt.getTime() <= Date.now())
  const totalViews = providerStories.reduce((sum, story) => sum + story.views, 0)
  const totalClicks = providerStories.reduce((sum, story) => sum + story.ctaClicks, 0)
  const totalReplies = providerStories.reduce((sum, story) => sum + story.replies, 0)
  const conversionRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length === 0) return

    const valid = files.filter((file) => {
      const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/')
      return isMedia && file.size <= 20 * 1024 * 1024
    })

    if (valid.length === 0) {
      setMessage('Seleccioná imágenes o videos válidos (máx. 20 MB cada uno)')
      return
    }

    const existingKeys = new Set(
      selectedItems.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`)
    )
    const incoming = valid.filter(
      (file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`)
    )
    const slots = Math.max(0, remainingToday - selectedItems.length)
    const accepted = incoming.slice(0, slots)

    if (accepted.length === 0) {
      setMessage(`Llegaste al máximo de ${storiesDailyLimit} historias por día`)
      return
    }

    if (incoming.length > accepted.length) {
      setMessage(`Se agregaron ${accepted.length}. El resto supera el límite de ${storiesDailyLimit} historias por día.`)
    } else if (valid.length !== files.length) {
      setMessage('Algunos archivos se omitieron porque no son imagen/video o superan 20 MB.')
    } else {
      setMessage('')
    }

    setSelectedItems((current) => [
      ...current,
      ...accepted.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        mediaType: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
      })),
    ])
  }

  const removeSelectedItem = (index: number) => {
    setSelectedItems((current) => {
      const next = [...current]
      const [removed] = next.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return next
    })
  }

  useEffect(() => {
    return () => {
      selectedItemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [])

  const handleSubmit = async () => {
    if (!user?.uid) return
    if (selectedItems.length === 0) {
      setMessage('Seleccioná al menos una imagen o video')
      return
    }
    if (!storyForm.city.trim()) {
      setMessage('Completá la ciudad para publicar la historia')
      return
    }
    if (remainingToday <= 0) {
      setMessage(`Llegaste al máximo de ${storiesDailyLimit} historias por día`)
      return
    }

    const itemsToPublish = selectedItems.slice(0, remainingToday)
    setSubmitting(true)
    setLoadingMedia(true)
    let published = 0

    try {
      const targetServiceId =
        storyForm.ctaType === 'contact' || storyForm.ctaType === 'none'
          ? ''
          : storyForm.ctaTarget || providerServices[0]?.id || ''
      const service = providerServices.find((item) => item.id === targetServiceId)

      for (let index = 0; index < itemsToPublish.length; index++) {
        const item = itemsToPublish[index]
        setMessage(`Publicando ${index + 1} de ${itemsToPublish.length}...`)
        const uploaded = await uploadStoryMedia(item.file, `stories/${user.uid}`)
        const result = await createStory({
          providerId: user.uid,
          providerName: user.displayName || user.email || 'Proveedor',
          providerImage: user.photoURL || '',
          serviceId: service?.id || '',
          serviceName: service?.name || '',
          city: storyForm.city.trim(),
          cityKey: normalizeLocationKey(storyForm.city),
          category: service?.category || '',
          mediaUrl: uploaded.url,
          mediaType: uploaded.mediaType,
          caption: storyForm.caption.trim(),
          ctaType: storyForm.ctaType,
          ctaTarget: targetServiceId || storyForm.ctaTarget.trim(),
        })

        if (!result.success) {
          setMessage(
            published > 0
              ? `Se publicaron ${published}. Error en la ${index + 1}: ${result.error || 'no se pudo publicar'}`
              : result.error || 'No se pudo publicar la historia'
          )
          return
        }
        published += 1
      }

      selectedItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setSelectedItems([])
      setStoryForm((current) => ({
        ...current,
        caption: '',
        ctaType: 'service',
        ctaTarget: providerServices[0]?.id || '',
      }))
      setMessage(
        published === 1 ? 'Historia publicada correctamente' : `${published} historias publicadas correctamente`
      )
    } catch (error: any) {
      setMessage(
        published > 0
          ? `Se publicaron ${published}. ${error.message || 'Error al continuar'}`
          : error.message || 'No se pudo publicar la historia'
      )
    } finally {
      setLoadingMedia(false)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setFlow('dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-primary">Historias</h1>
          <p className="text-xs text-muted-foreground">{storiesDailyLimit} por día · visibles solo en tu ciudad</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <StoriesLimitPromoBanner />
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Hoy</p>
              <p className="text-2xl font-bold">{todaysStories}/{storiesDailyLimit}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Conversiones</p>
              <p className="text-2xl font-bold">{conversionRate}%</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Plus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Crear nueva historia</h3>
                <p className="text-sm text-muted-foreground">Subí una o varias fotos: promo, trabajo reciente o turno libre.</p>
              </div>
              <Badge variant="secondary">Restan {remainingToday}</Badge>
            </div>

            {message && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-900">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{message}</p>
              </div>
            )}

            <div className="space-y-3">
              <Label>Imágenes</Label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                id="story-media-upload"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => document.getElementById('story-media-upload')?.click()}
                disabled={remainingToday <= 0 || submitting}
                className="w-full min-h-24 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-5 flex flex-col items-center justify-center gap-2 disabled:opacity-50"
              >
                <AppIcon name="camara" className="h-10 w-10" />
                <span className="text-lg font-bold text-primary">Cargar imagen</span>
                <span className="text-xs text-muted-foreground text-center">
                  Podés seleccionar varias a la vez (2, 3, 4, 5 o más)
                </span>
              </button>
              {selectedItems.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedItems.map((item, index) => (
                      <div key={`${item.file.name}-${item.file.lastModified}-${index}`} className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-100">
                        {item.mediaType === 'video' ? (
                          <video src={item.previewUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.previewUrl} alt={`Vista ${index + 1}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeSelectedItem(index)}
                          className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/65 text-white flex items-center justify-center"
                          aria-label="Quitar archivo"
                          disabled={submitting}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedItems.length} seleccionada{selectedItems.length === 1 ? '' : 's'} · restan {remainingToday} hoy
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={storyForm.city}
                onChange={(event) => setStoryForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="Ej: Rosario"
              />
            </div>

            <div className="space-y-2">
              <Label>Texto breve</Label>
              <Textarea
                value={storyForm.caption}
                onChange={(event) => setStoryForm((current) => ({ ...current, caption: event.target.value }))}
                placeholder="Promoción, turno libre, novedad..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>CTA</Label>
              <Select
                value={storyForm.ctaType}
                onValueChange={(value) => {
                  const ctaType = value as StoryCtaType
                  setStoryForm((current) => ({
                    ...current,
                    ctaType,
                    ctaTarget: ctaType === 'contact' ? current.ctaTarget : providerServices[0]?.id || '',
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná la acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Ver servicio</SelectItem>
                  <SelectItem value="booking">Reservar turno</SelectItem>
                  <SelectItem value="contact">Contactar</SelectItem>
                  <SelectItem value="none">Sin acción</SelectItem>
                </SelectContent>
              </Select>

              {storyForm.ctaType !== 'none' && (
                <>
                  {storyForm.ctaType === 'contact' ? (
                    <Input
                      value={storyForm.ctaTarget}
                      onChange={(event) => setStoryForm((current) => ({ ...current, ctaTarget: event.target.value }))}
                      placeholder="https://wa.me/549..."
                    />
                  ) : providerServices.length > 0 ? (
                    <Select
                      value={storyForm.ctaTarget || providerServices[0]?.id || ''}
                      onValueChange={(value) => setStoryForm((current) => ({ ...current, ctaTarget: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {providerServices.map((service: any) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-muted-foreground">
                      Creá al menos un servicio para usar CTA de reserva o servicio.
                    </div>
                  )}
                </>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || remainingToday <= 0 || !providerServices.length && storyForm.ctaType !== 'contact' && storyForm.ctaType !== 'none'}
              className="w-full h-12 font-semibold"
            >
              {loadingMedia || submitting
                ? 'Publicando...'
                : selectedItems.length > 1
                  ? `Publicar ${selectedItems.length} historias`
                  : 'Publicar historia'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground">Activas</p>
              <p className="text-xl font-bold">{activeStories.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground">Vistas</p>
              <p className="text-xl font-bold">{totalViews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground">Clicks</p>
              <p className="text-xl font-bold">{totalClicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground">Respuestas</p>
              <p className="text-xl font-bold">{totalReplies}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === 'active' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveTab('active')}
          >
            Activas
          </Button>
          <Button
            variant={activeTab === 'expired' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveTab('expired')}
          >
            Expiradas
          </Button>
        </div>

        <div className="space-y-3">
          {(activeTab === 'active' ? activeStories : expiredStories).map((story) => {
            const linkInfo = getStoryLinkInfo(story)
            return (
              <Card key={story.id}>
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {story.mediaType === 'video' ? (
                        <video src={story.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={story.mediaUrl} alt={story.caption} className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm line-clamp-1">{story.caption || 'Sin texto'}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{story.city} · {formatTimeAgo(story.createdAt)}</p>
                        </div>
                        <Badge variant={story.active && story.expiresAt.getTime() > Date.now() ? 'default' : 'secondary'}>
                          {story.active && story.expiresAt.getTime() > Date.now() ? 'Activa' : 'Expirada'}
                        </Badge>
                      </div>

                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{story.views}</span>
                        <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" />{story.ctaClicks}</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{story.replies}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{linkInfo.title}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{linkInfo.subtitle}</p>

                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="h-8" onClick={() => toggleStoryActive(story.id, !story.active)}>
                          {story.active ? 'Pausar' : 'Reactivar'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200" onClick={() => {
                          if (confirm('¿Eliminar esta historia?')) {
                            void deleteStory(story.id)
                          }
                        }}>
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {(activeTab === 'active' ? activeStories : expiredStories).length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No tenés historias {activeTab === 'active' ? 'activas' : 'expiradas'}.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
