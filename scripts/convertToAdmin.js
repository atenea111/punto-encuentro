// Script para convertir usuario actual en admin
// Ejecutar en la consola del navegador (F12 -> Console)

async function convertToAdmin() {
  try {
    // Importar Firebase
    const { doc, updateDoc } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    const { auth } = await import('@/lib/firebase')
    
    // Obtener usuario actual
    const user = auth.currentUser
    
    if (!user) {
      console.error('No hay usuario logueado')
      return
    }
    
    console.log('Convirtiendo usuario a admin:', user.email)
    
    // Actualizar rol en Firestore
    await updateDoc(doc(db, 'users', user.uid), {
      role: 'admin',
      permissions: ['manage_all'],
      updatedAt: new Date()
    })
    
    console.log('✅ Usuario convertido a admin exitosamente')
    console.log('🔄 Recarga la página para ver el panel de administración')
    
    // Recargar página
    window.location.reload()
    
  } catch (error) {
    console.error('❌ Error al convertir a admin:', error)
  }
}

// Ejecutar función
convertToAdmin()
