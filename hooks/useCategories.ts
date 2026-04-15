import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
  { name: "Belleza", icon: "💄", description: "Estética, peluquería y cuidado personal" },
  { name: "Salud", icon: "🩺", description: "Salud, bienestar y medicina" },
  { name: "Deporte", icon: "⚽", description: "Entrenamiento, deportes y vida sana" },
  { name: "Hogar", icon: "🏠", description: "Reparaciones, limpieza y mantenimiento del hogar" },
  { name: "Educación", icon: "📚", description: "Clases particulares, idiomas y apoyo escolar" },
  { name: "Tecnología", icon: "💻", description: "Soporte técnico, programación y dispositivos" },
  { name: "Oficios", icon: "🔨", description: "Carpintería, electricidad, plomería y más" },
  { name: "Profesionales", icon: "💼", description: "Abogados, contadores y servicios especializados" },
  { name: "Aprendizaje", icon: "🎓", description: "Cursos, talleres y capacitación profesional" }
]

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
      const existingNames = new Set(existingSnapshot.docs.map(doc => doc.data().name))
      
      const batch = writeBatch(db)
      let addedCount = 0
      
      for (const cat of DEFAULT_CATEGORIES) {
        if (!existingNames.has(cat.name)) {
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
      
      if (addedCount > 0) {
        await batch.commit()
        console.log(`✅ ${addedCount} categorías iniciales sembradas con éxito`)
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
        await seedCategories()
        return
      }
      
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Category[]
      
      // Deduplicar por nombre (preferir las que tienen isBase: true)
      const uniqueMap = new Map<string, Category>()
      categoriesData.forEach(cat => {
        const existing = uniqueMap.get(cat.name)
        if (!existing || (!existing.isBase && cat.isBase)) {
          uniqueMap.set(cat.name, cat)
        }
      })
      
      const dedupedCategories = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name))
      setCategories(dedupedCategories)
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
