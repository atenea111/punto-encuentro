import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export interface GeoPosition {
  latitude: number
  longitude: number
  city?: string
  address?: string
}

/**
 * Hook híbrido que obtiene la ubicación actual usando el plugin nativo de Capacitor
 * en móviles o la API del navegador en la web.
 */
export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAddress, setLoadingAddress] = useState(false)

  // Función para obtener dirección legible (Reverse Geocoding)
  const fetchAddress = async (lat: number, lon: number) => {
    setLoadingAddress(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      )
      const data = await response.json()
      
      const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.state_district || ''
      const state = data.address.state || ''
      const displayName = city && state ? `${city}, ${state}` : city || state || ''

      setPosition(prev => prev ? {
        ...prev,
        city: city,
        address: displayName
      } : {
        latitude: lat,
        longitude: lon,
        city: city,
        address: displayName
      })
    } catch (err) {
      console.error('Error in reverse geocoding:', err)
    } finally {
      setLoadingAddress(false)
    }
  }

  const getPosition = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Uso de Capacitor si estamos en plataforma nativa
      if (Capacitor.isNativePlatform()) {
        const permissions = await Geolocation.checkPermissions()
        
        if (permissions.location !== 'granted') {
          const request = await Geolocation.requestPermissions()
          if (request.location !== 'granted') {
            throw new Error('Permisos de ubicación denegados por el sistema')
          }
        }

        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        })

        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }
        
        setPosition(coords)
        await fetchAddress(coords.latitude, coords.longitude)
      } else {
        // Fallback Web estándar
        if (!navigator.geolocation) {
          throw new Error('Tu navegador no soporta geolocalización')
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }
            setPosition(coords)
            fetchAddress(coords.latitude, coords.longitude)
          },
          (err) => {
            console.warn('Error de geolocalización web:', err.message)
            setError('No pudimos obtener tu ubicación automáticamente')
            setLoading(false)
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000,
          }
        )
      }
    } catch (err: any) {
      console.error('Geolocation logic error:', err)
      setError(err.message || 'Error al obtener ubicación')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getPosition()
  }, [getPosition])

  return { position, error, loading, loadingAddress, retry: getPosition, setPosition }
}
