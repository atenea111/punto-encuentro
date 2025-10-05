// Script para corregir la estructura de datos en Firestore
// Ejecutar en la consola del navegador (F12 -> Console)

async function fixUserDataStructure() {
  try {
    // Importar Firebase
    const { doc, getDoc, updateDoc } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    const { auth } = await import('@/lib/firebase')
    
    // Obtener usuario actual
    const user = auth.currentUser
    
    if (!user) {
      console.error('No hay usuario logueado')
      return
    }
    
    console.log('Corrigiendo estructura de datos para:', user.email)
    
    // Obtener datos actuales
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log('Datos actuales:', userData)
      
      // Corregir estructura
      const correctedData = {
        role: userData.role || 'client', // Asegurar que role esté en el nivel superior
        permissions: Array.isArray(userData.permissions) ? userData.permissions : [], // Asegurar que permissions sea un array
        createdAt: userData.createdAt || new Date(),
        updatedAt: new Date()
      }
      
      console.log('Datos corregidos:', correctedData)
      
      // Actualizar documento
      await updateDoc(doc(db, 'users', user.uid), correctedData)
      
      console.log('✅ Estructura de datos corregida exitosamente')
      console.log('🔄 Recarga la página para ver los cambios')
      
      // Recargar página
      window.location.reload()
      
    } else {
      console.error('No se encontró el documento del usuario')
    }
    
  } catch (error) {
    console.error('❌ Error al corregir estructura:', error)
  }
}

// Ejecutar función
fixUserDataStructure()
