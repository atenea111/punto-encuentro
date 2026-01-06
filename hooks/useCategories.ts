import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Category {
  id: string
  name: string
  icon: string
  description?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const categoriesRef = collection(db, 'categories')
      const q = query(categoriesRef, orderBy('name', 'asc'))
      const querySnapshot = await getDocs(q)
      
      const categoriesData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
        }
      }) as Category[]
      
      setCategories(categoriesData)
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
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Agregar a la lista local
      const newCategory: Category = {
        id: docRef.id,
        ...categoryData,
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
