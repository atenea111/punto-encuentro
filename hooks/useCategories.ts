import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { getCategoryIconSrc } from '@/lib/categoryIcons'
import { normalizeSearchText } from '@/lib/searchUtils'

export interface Category {
  id: string
  name: string
  icon: string
  description?: string
  active: boolean
  isBase?: boolean
  createdAt: Date
  updatedAt: Date
}

const DEFAULT_CATEGORIES = [
  { name: "Automotor", icon: "/categorias/01_Automotor.jpg", description: "Autos, motos, talleres y recambios" },
  { name: "Belleza", icon: "/categorias/02_Belleza.jpg", description: "Estética, peluquería y cuidado personal" },
  { name: "Construcción", icon: "/categorias/03_Construccion.jpg", description: "Obras, materiales y reformas" },
  { name: "Deportes", icon: "/categorias/04_Deportes.jpg", description: "Entrenamiento, deportes y vida sana" },
  { name: "Educación", icon: "/categorias/05_Educacion.jpg", description: "Clases particulares, idiomas y apoyo escolar" },
  { name: "Entretenimiento", icon: "/categorias/06_Entretenimiento.jpg", description: "Shows, ocio y actividades" },
  { name: "Gastronomía", icon: "/categorias/07_Gastronomia.jpg", description: "Restaurantes, panaderías, delivery y comida" },
  { name: "Hogar", icon: "/categorias/08_Hogar.jpg", description: "Reparaciones, limpieza y mantenimiento del hogar" },
  { name: "Inmobiliaria", icon: "/categorias/09_Inmobiliaria.jpg", description: "Alquileres, ventas y tasaciones" },
  { name: "Mascotas", icon: "/categorias/10_Mascotas.jpg", description: "Veterinaria, peluquería y cuidado animal" },
  { name: "Oficios", icon: "/categorias/11_Oficios.jpg", description: "Carpintería, electricidad, plomería y más" },
  { name: "Profesionales", icon: "/categorias/12_Profesionales.jpg", description: "Abogados, contadores y servicios especializados" },
  { name: "Salud", icon: "/categorias/13_Salud.jpg", description: "Salud, bienestar y medicina" },
  { name: "Tecnología", icon: "/categorias/14_Tecnologia.jpg", description: "Soporte técnico, programación y dispositivos" },
  { name: "Tiendas y compras", icon: "/categorias/15_Tiendas_y_compras.jpg", description: "Comercios, indumentaria y ventas" },
  { name: "Transporte", icon: "/categorias/16_Transporte.jpg", description: "Fletes, mudanzas y traslados" },
  { name: "Turismo y alojamiento", icon: "/categorias/17_Turismo_y_alojamiento.jpg", description: "Hospedaje, viajes y turismo" },
]

const REMOVED_CATEGORIES = ["Aprendizaje", "Deporte"]

function isRemovedCategory(name: string) {
  const normalized = normalizeSearchText(name)
  return REMOVED_CATEGORIES.some((removed) => normalizeSearchText(removed) === normalized)
}

async function currentUserIsAdmin() {
  const user = auth.currentUser
  if (!user) return false
  const snapshot = await getDoc(doc(db, 'users', user.uid))
  return snapshot.data()?.role === 'admin'
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const seedCategories = async () => {
    try {
      console.log('Sembrando categorías iniciales...')
      const categoriesRef = collection(db, 'categories')
      const existingSnapshot = await getDocs(categoriesRef)
      const existingNames = new Set(
        existingSnapshot.docs.map((categoryDoc) => normalizeSearchText(String(categoryDoc.data().name || '')))
      )
      
      const batch = writeBatch(db)
      let addedCount = 0
      let updatedCount = 0
      let removedCount = 0
      
      for (const cat of DEFAULT_CATEGORIES) {
        if (!existingNames.has(normalizeSearchText(cat.name))) {
          const newDocRef = doc(categoriesRef)
          batch.set(newDocRef, {
            ...cat,
            active: true,
            isBase: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          addedCount++
        }
      }

      existingSnapshot.docs.forEach((categoryDoc) => {
        const data = categoryDoc.data()
        const name = String(data.name || '')
        if (isRemovedCategory(name)) {
          batch.delete(categoryDoc.ref)
          removedCount++
          return
        }
        const nextIcon = getCategoryIconSrc(name, String(data.icon || ''))
        if (nextIcon && data.icon !== nextIcon) {
          batch.update(categoryDoc.ref, { icon: nextIcon, updatedAt: new Date() })
          updatedCount++
        }
      })
      
      if (addedCount > 0 || updatedCount > 0 || removedCount > 0) {
        await batch.commit()
        console.log(`✅ Categorías: ${addedCount} nuevas, ${updatedCount} con logo actualizado, ${removedCount} quitadas`)
      }
      await fetchCategories()
    } catch (error) {
      console.error('Error seeding categories:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const categoriesRef = collection(db, 'categories')
      const q = query(categoriesRef, orderBy('name', 'asc'))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        if (await currentUserIsAdmin()) {
          await seedCategories()
        } else {
          const now = new Date()
          setCategories(DEFAULT_CATEGORIES.map((category, index) => ({
            id: `default-${index}`,
            ...category,
            active: true,
            isBase: true,
            createdAt: now,
            updatedAt: now,
          })))
        }
        return
      }
      
      const categoriesData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
        }
      }) as Category[]
      
      // Deduplicar por nombre (preferir las que tienen isBase: true)
      const uniqueMap = new Map<string, Category>()
      categoriesData.forEach(cat => {
        if (isRemovedCategory(cat.name)) return
        const existing = uniqueMap.get(cat.name)
        if (!existing || (!existing.isBase && cat.isBase)) {
          uniqueMap.set(cat.name, cat)
        }
      })
      
      const dedupedCategories = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name))

      const existingNormalized = new Set(
        Array.from(uniqueMap.keys()).map((name) => normalizeSearchText(name))
      )
      const missingDefaults = DEFAULT_CATEGORIES.some(
        (cat) => !existingNormalized.has(normalizeSearchText(cat.name))
      )
      const hasRemovedCategories = querySnapshot.docs.some((categoryDoc) =>
        isRemovedCategory(String(categoryDoc.data().name || ''))
      )
      const iconsNeedUpdate = querySnapshot.docs.some((categoryDoc) => {
        const data = categoryDoc.data()
        if (isRemovedCategory(String(data.name || ''))) return false
        const nextIcon = getCategoryIconSrc(String(data.name || ''), String(data.icon || ''))
        return Boolean(nextIcon && data.icon !== nextIcon)
      })
      setCategories(dedupedCategories)

      if ((missingDefaults || iconsNeedUpdate || hasRemovedCategories) && await currentUserIsAdmin()) {
        await seedCategories()
        return
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...categoryData,
        isBase: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Agregar a la lista local
      const newCategory: Category = {
        id: docRef.id,
        ...categoryData,
        isBase: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
      
      return { success: true, id: docRef.id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    try {
      const categoryRef = doc(db, 'categories', id)
      await updateDoc(categoryRef, {
        ...categoryData,
        updatedAt: new Date()
      })
      
      // Actualizar en la lista local
      setCategories(prev => 
        prev.map(cat => 
          cat.id === id 
            ? { ...cat, ...categoryData, updatedAt: new Date() }
            : cat
        ).sort((a, b) => a.name.localeCompare(b.name))
      )
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id))
      
      // Remover de la lista local
      setCategories(prev => prev.filter(cat => cat.id !== id))
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const toggleCategoryStatus = async (id: string) => {
    const category = categories.find(cat => cat.id === id)
    if (!category) return { success: false, error: 'Category not found' }
    
    return updateCategory(id, { active: !category.active })
  }

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
  }
}
