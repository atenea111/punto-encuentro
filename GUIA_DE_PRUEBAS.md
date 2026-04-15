# Guía de Pruebas - Punto Encuentro

## 📋 Índice
1. [Preparación Inicial](#preparación-inicial)
2. [Pruebas como Cliente](#pruebas-como-cliente)
3. [Pruebas como Proveedor](#pruebas-como-proveedor)
4. [Pruebas como Administrador](#pruebas-como-administrador)
5. [Pruebas de Integración](#pruebas-de-integración)
6. [Checklist de Pruebas](#checklist-de-pruebas)

---

## 🔧 Preparación Inicial

### 1. Configuración del Entorno

```bash
# 1. Asegúrate de tener todas las dependencias instaladas
npm install

# 2. Verifica que Firebase esté configurado
# Revisa que lib/firebase.ts tenga las credenciales correctas

# 3. Inicia el servidor de desarrollo
npm run dev
```

### 2. Preparar Datos de Prueba

Antes de comenzar, asegúrate de tener:
- ✅ Firebase configurado y funcionando
- ✅ Colecciones creadas en Firestore: `users`, `services`, `bookings`, `categories`
- ✅ Al menos una categoría creada en Firestore

### 3. Crear Usuario Administrador

Para crear un usuario administrador, puedes usar el script:

```bash
node scripts/convertToAdmin.js
```

O manualmente en Firestore:
- Crear un documento en `users` con `role: 'admin'`

---

## 👤 Pruebas como Cliente

### Flujo 1: Registro y Primer Acceso

**Pasos:**
1. Abre la aplicación en `http://localhost:3000`
2. Selecciona "Soy Cliente"
3. Haz clic en "Registrarse"
4. Completa el formulario:
   - Nombre completo: `Juan Pérez`
   - Email: `cliente@test.com`
   - Contraseña: `password123`
5. Haz clic en "Registrarse"

**Resultado Esperado:**
- ✅ Mensaje de éxito
- ✅ Redirección automática al home del cliente
- ✅ Usuario creado en Firebase Auth
- ✅ Documento creado en Firestore con `role: 'client'`

**Verificar en Firebase:**
- Firestore → `users` → Buscar por email → Verificar `role: 'client'`

---

### Flujo 2: Login de Cliente

**Pasos:**
1. Cierra sesión si estás logueado
2. Selecciona "Soy Cliente"
3. Haz clic en "Iniciar sesión"
4. Ingresa:
   - Email: `cliente@test.com`
   - Contraseña: `password123`
5. Haz clic en "Iniciar sesión"

**Resultado Esperado:**
- ✅ Login exitoso
- ✅ Redirección al home del cliente
- ✅ Sesión persistente (recargar página y seguir logueado)

---

### Flujo 3: Búsqueda de Servicios

**Pasos:**
1. En el home del cliente, busca en el campo de búsqueda:
   - Prueba: `masaje`
   - Prueba: `peluquería`
   - Prueba: `plomero`
2. Haz clic en una categoría (ej: "Belleza")
3. Navega a "Ver más" en recomendados
4. Navega a "Cerca tuyo"

**Resultado Esperado:**
- ✅ Los servicios se filtran correctamente
- ✅ Las categorías muestran servicios relacionados
- ✅ La navegación funciona sin errores

---

### Flujo 4: Ver Detalle de Servicio

**Pasos:**
1. Haz clic en cualquier servicio de la lista
2. Revisa la información mostrada:
   - Nombre del servicio
   - Precio
   - Descripción
   - Categoría
   - Proveedor

**Resultado Esperado:**
- ✅ Toda la información se muestra correctamente
- ✅ Botón "Agendar turno" visible y funcional
- ✅ Botón de volver funciona

---

### Flujo 5: Crear Reserva

**Pasos:**
1. Desde el detalle del servicio, haz clic en "Agendar turno"
2. Selecciona una fecha en el calendario (fecha futura)
3. Selecciona un horario disponible
4. Haz clic en "Confirmar turno"
5. En la pantalla de pago:
   - Selecciona método de pago: "Efectivo"
   - Haz clic en "Confirmar pago"

**Resultado Esperado:**
- ✅ Calendario muestra fechas disponibles
- ✅ Horarios se pueden seleccionar
- ✅ Reserva creada en Firestore
- ✅ Mensaje de confirmación
- ✅ Redirección al home

**Verificar en Firebase:**
- Firestore → `bookings` → Buscar por `clientId` → Verificar datos de la reserva

---

### Flujo 6: Ver Agenda del Cliente

**Pasos:**
1. En el home, haz clic en la pestaña "Agenda" (📅)
2. Revisa el calendario
3. Haz clic en un día con reservas
4. Revisa las reservas del día seleccionado

**Resultado Esperado:**
- ✅ Calendario muestra días con reservas marcados
- ✅ Al seleccionar un día, se muestran las reservas
- ✅ Información de reservas correcta (servicio, fecha, hora, precio, estado)

---

### Flujo 7: Cancelar Reserva

**Pasos:**
1. Ve a "Agenda"
2. Selecciona un día con reservas pendientes
3. Haz clic en "Cancelar" en una reserva
4. Confirma la cancelación

**Resultado Esperado:**
- ✅ Confirmación de cancelación
- ✅ Reserva actualizada a estado "cancelled" en Firestore
- ✅ Reserva desaparece o se marca como cancelada en la vista

**Verificar en Firebase:**
- Firestore → `bookings` → Verificar `status: 'cancelled'`

---

### Flujo 8: Editar Perfil del Cliente

**Pasos:**
1. Ve a "Perfil" (👤)
2. Haz clic en "Editar perfil"
3. Modifica:
   - Nombre: `Juan Carlos Pérez`
   - Teléfono: `11 1234-5678`
   - Dirección: `Av. Corrientes 1234, CABA`
4. Haz clic en el ícono de cámara (📷) para subir foto
5. Selecciona una imagen (máximo 5MB)
6. Haz clic en "Guardar"

**Resultado Esperado:**
- ✅ Formulario se muestra correctamente
- ✅ Foto se sube y muestra (URL temporal)
- ✅ Datos se guardan en Firestore
- ✅ Mensaje de éxito
- ✅ Cambios reflejados en el perfil

**Verificar en Firebase:**
- Firestore → `users` → Verificar datos actualizados

---

### Flujo 9: Ver Mis Reservas en Perfil

**Pasos:**
1. En el perfil, revisa la sección "Mis reservas"
2. Verifica que se muestren las reservas recientes

**Resultado Esperado:**
- ✅ Se muestran hasta 3 reservas recientes
- ✅ Información correcta (servicio, fecha, estado, precio)
- ✅ Botón "Ver todas" lleva a la agenda

---

### Flujo 10: Cerrar Sesión

**Pasos:**
1. En el perfil, haz clic en "Cerrar sesión"
2. Confirma si es necesario

**Resultado Esperado:**
- ✅ Sesión cerrada
- ✅ Redirección a la pantalla de selección de tipo de usuario
- ✅ localStorage limpiado

---

## 🏢 Pruebas como Proveedor

### Flujo 1: Registro de Proveedor

**Pasos:**
1. Abre la aplicación
2. Selecciona "Soy Proveedor"
3. Haz clic en "Registrarse"
4. Completa el formulario:
   - Nombre del negocio: `Spa Relax`
   - Email: `proveedor@test.com`
   - Teléfono: `11 9876-5432`
   - Contraseña: `password123`
5. Haz clic en "Registrarse"

**Resultado Esperado:**
- ✅ Registro exitoso
- ✅ Redirección al dashboard
- ✅ Usuario creado con `role: 'provider'` y `isVerified: false`

**Verificar en Firebase:**
- Firestore → `users` → Verificar `role: 'provider'` y `isVerified: false`

---

### Flujo 2: Dashboard del Proveedor

**Pasos:**
1. Inicia sesión como proveedor
2. Revisa el dashboard:
   - Estadísticas (Clientes únicos, Ingresos totales)
   - Mis Servicios
   - Próximos Turnos

**Resultado Esperado:**
- ✅ Dashboard se carga correctamente
- ✅ Estadísticas muestran datos (pueden ser 0 si no hay datos)
- ✅ Navegación a otras secciones funciona

---

### Flujo 3: Crear Servicio

**Pasos:**
1. En el dashboard, haz clic en "Gestionar servicios"
2. Haz clic en "Crear nuevo servicio"
3. Completa el formulario:
   - Nombre: `Masaje Relajante`
   - Descripción: `Masaje terapéutico de 60 minutos`
   - Precio: `5000`
   - Duración: `60 min`
   - Categoría: `Salud`
4. Haz clic en "Crear servicio"

**Resultado Esperado:**
- ✅ Servicio creado exitosamente
- ✅ Redirección a la lista de servicios
- ✅ Servicio visible en la lista
- ✅ Servicio guardado en Firestore

**Verificar en Firebase:**
- Firestore → `services` → Verificar datos del servicio

---

### Flujo 4: Editar Servicio

**Pasos:**
1. En "Gestión de Servicios", haz clic en "Editar" en un servicio
2. Modifica:
   - Precio: `5500`
   - Descripción: `Masaje terapéutico mejorado de 60 minutos`
3. Haz clic en "Guardar cambios"

**Resultado Esperado:**
- ✅ Formulario se carga con datos actuales
- ✅ Cambios guardados correctamente
- ✅ Redirección a la lista
- ✅ Cambios reflejados en Firestore

**Verificar en Firebase:**
- Firestore → `services` → Verificar datos actualizados

---

### Flujo 5: Activar/Desactivar Servicio

**Pasos:**
1. En "Gestión de Servicios", haz clic en "Desactivar" en un servicio activo
2. Verifica que el estado cambie
3. Haz clic en "Activar" para reactivarlo

**Resultado Esperado:**
- ✅ Estado cambia correctamente
- ✅ Badge muestra el estado actualizado
- ✅ Cambio reflejado en Firestore

---

### Flujo 6: Eliminar Servicio

**Pasos:**
1. En "Gestión de Servicios", haz clic en "Eliminar" en un servicio
2. Confirma la eliminación

**Resultado Esperado:**
- ✅ Confirmación de eliminación
- ✅ Servicio eliminado de la lista
- ✅ Servicio eliminado de Firestore

**Verificar en Firebase:**
- Firestore → `services` → Verificar que el documento fue eliminado

---

### Flujo 7: Ver Agenda del Proveedor

**Pasos:**
1. En el dashboard, haz clic en "Ver agenda"
2. Revisa el calendario
3. Haz clic en un día con reservas
4. Revisa las reservas del día

**Resultado Esperado:**
- ✅ Calendario muestra días con reservas
- ✅ Reservas se muestran correctamente
- ✅ Información completa (cliente, servicio, hora, precio, estado)

---

### Flujo 8: Confirmar Reserva Pendiente

**Pasos:**
1. En la agenda, selecciona un día con reservas pendientes
2. Haz clic en "Confirmar" en una reserva pendiente
3. Verifica el cambio de estado

**Resultado Esperado:**
- ✅ Reserva confirmada
- ✅ Estado cambia a "confirmed"
- ✅ Botones de acción desaparecen
- ✅ Cambio reflejado en Firestore

**Verificar en Firebase:**
- Firestore → `bookings` → Verificar `status: 'confirmed'`

---

### Flujo 9: Cancelar Reserva como Proveedor

**Pasos:**
1. En la agenda, selecciona una reserva pendiente
2. Haz clic en "Cancelar"
3. Confirma la cancelación

**Resultado Esperado:**
- ✅ Confirmación de cancelación
- ✅ Estado cambia a "cancelled"
- ✅ Cambio reflejado en Firestore

---

### Flujo 10: Ver Estadísticas del Proveedor

**Pasos:**
1. En el perfil, haz clic en "Ver estadísticas"
2. Revisa las métricas:
   - Visualizaciones
   - Reservas
   - Ingresos
   - Tasa de conversión
3. Revisa el rendimiento por servicio

**Resultado Esperado:**
- ✅ Estadísticas se calculan correctamente
- ✅ Rendimiento por servicio se muestra
- ✅ Datos son precisos

---

### Flujo 11: Editar Perfil del Proveedor

**Pasos:**
1. Ve a "Perfil"
2. Haz clic en "Editar"
3. Modifica:
   - Nombre del negocio: `Spa Relax Premium`
   - Teléfono: `11 9876-5433`
   - Dirección: `Av. Santa Fe 2000`
   - Descripción: `El mejor spa de la ciudad`
   - Horarios de atención
4. Sube foto de perfil (📷)
5. Sube foto de portada
6. Haz clic en "Guardar Cambios"

**Resultado Esperado:**
- ✅ Formulario completo funcional
- ✅ Fotos se suben correctamente
- ✅ Datos guardados en Firestore
- ✅ Cambios reflejados en el perfil

---

### Flujo 12: Suscripción Premium

**Pasos:**
1. En el dashboard, haz clic en "Ver planes" (si aparece el banner)
2. O ve a "Suscripción" desde el menú
3. Revisa los planes disponibles
4. Selecciona un plan (Mensual o Anual)
5. Haz clic en "Suscribirme ahora"

**Resultado Esperado:**
- ✅ Planes se muestran correctamente
- ✅ Selección de plan funciona
- ✅ Mensaje de confirmación (simulado)

---

## 👨‍💼 Pruebas como Administrador

### Flujo 1: Login como Administrador

**Pasos:**
1. Inicia sesión con un usuario que tenga `role: 'admin'`
2. Verifica que se redirija al dashboard de administrador

**Resultado Esperado:**
- ✅ Login exitoso
- ✅ Redirección al dashboard admin
- ✅ No aparece selección de tipo de usuario

---

### Flujo 2: Dashboard del Administrador

**Pasos:**
1. Revisa las métricas del dashboard:
   - Usuarios activos hoy
   - Nuevos usuarios esta semana
   - Comercios activos
   - Comercios pendientes de verificación
   - Publicaciones nuevas/pendientes/denunciadas
   - Cantidad de chats iniciados
   - Top 5 búsquedas del día
2. Haz clic en el botón de "Alertas"

**Resultado Esperado:**
- ✅ Todas las métricas se muestran
- ✅ Datos son precisos
- ✅ Panel de alertas funciona

---

### Flujo 3: Gestión de Categorías

**Pasos:**
1. Ve a la pestaña "Categorías"
2. Haz clic en "Crear Categoría"
3. Completa:
   - Nombre: `Fitness`
   - Descripción: `Servicios de entrenamiento y fitness`
4. Guarda la categoría
5. Activa/desactiva una categoría
6. Edita una categoría
7. Elimina una categoría

**Resultado Esperado:**
- ✅ CRUD completo funciona
- ✅ Cambios reflejados en Firestore
- ✅ Categorías aparecen en la lista

**Verificar en Firebase:**
- Firestore → `categories` → Verificar operaciones

---

### Flujo 4: Gestión de Usuarios

**Pasos:**
1. Ve a la pestaña "Usuarios"
2. Revisa la lista de usuarios
3. Filtra por rol (Cliente, Proveedor, Admin)
4. Cambia el rol de un usuario
5. Activa/desactiva un usuario
6. Elimina un usuario (cuidado con datos de prueba)

**Resultado Esperado:**
- ✅ Lista de usuarios se carga
- ✅ Filtros funcionan
- ✅ Cambios de rol funcionan
- ✅ Activación/desactivación funciona
- ✅ Eliminación funciona

**Verificar en Firebase:**
- Firestore → `users` → Verificar cambios

---

### Flujo 5: Verificar Proveedor

**Pasos:**
1. En "Usuarios", busca un proveedor con `isVerified: false`
2. Cambia su estado a verificado
3. Verifica que el cambio se refleje

**Resultado Esperado:**
- ✅ Estado de verificación cambia
- ✅ Cambio reflejado en Firestore

---

### Flujo 6: Gestión de Servicios (Admin)

**Pasos:**
1. Ve a la pestaña "Servicios"
2. Revisa la lista de todos los servicios
3. Edita un servicio
4. Elimina un servicio (si es necesario)

**Resultado Esperado:**
- ✅ Lista completa de servicios
- ✅ Edición funciona
- ✅ Eliminación funciona

---

### Flujo 7: Generar Informe Diario

**Pasos:**
1. Ve a la pestaña "Informes"
2. Selecciona "Diario"
3. Revisa el informe generado:
   - Usuarios activos
   - Publicaciones nuevas
   - Chats iniciados
   - Denuncias

**Resultado Esperado:**
- ✅ Informe se genera automáticamente
- ✅ Datos son precisos
- ✅ Información completa

---

### Flujo 8: Generar Informe Semanal

**Pasos:**
1. En "Informes", selecciona "Semanal"
2. Haz clic en "Generar Informe Semanal"
3. Revisa:
   - Ranking de búsquedas por ciudad
   - Promociones con mejor rendimiento
   - Promociones con peor rendimiento

**Resultado Esperado:**
- ✅ Informe se genera
- ✅ Datos agregados correctamente
- ✅ Rankings son precisos

---

### Flujo 9: Generar Informe Mensual

**Pasos:**
1. En "Informes", selecciona "Mensual"
2. Haz clic en "Generar Informe Mensual"
3. Revisa:
   - Crecimiento general
   - Retención de usuarios
   - Resumen de promociones

**Resultado Esperado:**
- ✅ Informe se genera
- ✅ Métricas de crecimiento correctas
- ✅ Datos de retención precisos

---

### Flujo 10: Panel de Alertas

**Pasos:**
1. Haz clic en el botón "Alertas" en el dashboard
2. Revisa las alertas mostradas:
   - Proveedores pendientes de verificación
   - Servicios denunciados
   - Usuarios inactivos
   - Reservas pendientes de atención

**Resultado Esperado:**
- ✅ Alertas se muestran correctamente
- ✅ Información es relevante
- ✅ Navegación a elementos funciona

---

## 🔗 Pruebas de Integración

### Flujo 1: Reserva Completa Cliente-Proveedor

**Pasos:**
1. Como cliente, crea una reserva
2. Como proveedor, ve a tu agenda
3. Verifica que la reserva aparezca
4. Como proveedor, confirma la reserva
5. Como cliente, verifica que el estado cambió

**Resultado Esperado:**
- ✅ Reserva visible para ambos
- ✅ Cambios de estado se sincronizan
- ✅ Datos consistentes en Firestore

---

### Flujo 2: Servicio Visible para Clientes

**Pasos:**
1. Como proveedor, crea un servicio activo
2. Como cliente, busca el servicio
3. Verifica que aparezca en los resultados

**Resultado Esperado:**
- ✅ Servicio visible para clientes
- ✅ Búsqueda funciona correctamente
- ✅ Información completa

---

### Flujo 3: Servicio Inactivo No Visible

**Pasos:**
1. Como proveedor, desactiva un servicio
2. Como cliente, busca ese servicio
3. Verifica que NO aparezca

**Resultado Esperado:**
- ✅ Servicio inactivo no aparece en búsquedas
- ✅ Solo servicios activos son visibles

---

## ✅ Checklist de Pruebas

### Funcionalidades Cliente
- [ ] Registro de cliente
- [ ] Login de cliente
- [ ] Búsqueda de servicios
- [ ] Filtrado por categorías
- [ ] Ver detalle de servicio
- [ ] Crear reserva
- [ ] Seleccionar fecha y hora
- [ ] Seleccionar método de pago
- [ ] Ver agenda con reservas
- [ ] Cancelar reserva
- [ ] Editar perfil
- [ ] Subir foto de perfil
- [ ] Ver mis reservas
- [ ] Cerrar sesión

### Funcionalidades Proveedor
- [ ] Registro de proveedor
- [ ] Login de proveedor
- [ ] Ver dashboard
- [ ] Crear servicio
- [ ] Editar servicio
- [ ] Activar/desactivar servicio
- [ ] Eliminar servicio
- [ ] Ver agenda
- [ ] Confirmar reserva
- [ ] Cancelar reserva
- [ ] Ver estadísticas
- [ ] Editar perfil completo
- [ ] Subir fotos (perfil y portada)
- [ ] Ver suscripción premium
- [ ] Cerrar sesión

### Funcionalidades Administrador
- [ ] Login como admin
- [ ] Ver dashboard con métricas
- [ ] Ver panel de alertas
- [ ] Crear categoría
- [ ] Editar categoría
- [ ] Activar/desactivar categoría
- [ ] Eliminar categoría
- [ ] Ver lista de usuarios
- [ ] Filtrar usuarios por rol
- [ ] Cambiar rol de usuario
- [ ] Activar/desactivar usuario
- [ ] Verificar proveedor
- [ ] Eliminar usuario
- [ ] Ver todos los servicios
- [ ] Generar informe diario
- [ ] Generar informe semanal
- [ ] Generar informe mensual
- [ ] Cerrar sesión

### Integración
- [ ] Reserva visible para cliente y proveedor
- [ ] Cambios de estado se sincronizan
- [ ] Servicios activos visibles para clientes
- [ ] Servicios inactivos no visibles
- [ ] Datos consistentes en Firestore

### UI/UX
- [ ] Navegación fluida
- [ ] Mensajes de error claros
- [ ] Mensajes de éxito
- [ ] Loading states
- [ ] Responsive design
- [ ] Colores según diseño (petróleo, naranja)
- [ ] Tarjetas con fondo blanco

---

## 🐛 Problemas Comunes y Soluciones

### Error: "No se pueden cargar servicios"
**Solución:** Verificar que la colección `services` exista en Firestore

### Error: "Usuario no encontrado"
**Solución:** Verificar que el usuario tenga un documento en `users` con el `role` correcto

### Error: "Reserva no se crea"
**Solución:** Verificar que el servicio tenga `providerId` y `providerName` correctos

### Error: "No se puede subir imagen"
**Solución:** Actualmente las imágenes usan URLs temporales. Para producción, integrar Firebase Storage.

### Error: "Dashboard admin no carga"
**Solución:** Verificar que el usuario tenga `role: 'admin'` en Firestore

---

## 📝 Notas Importantes

1. **Datos de Prueba**: Usa emails únicos para cada prueba para evitar conflictos
2. **Firebase**: Asegúrate de tener las reglas de seguridad configuradas para desarrollo
3. **Imágenes**: Las imágenes se suben temporalmente. En producción, usar Firebase Storage
4. **Reservas**: Las fechas deben ser futuras para que aparezcan como disponibles
5. **Roles**: Los roles se asignan automáticamente en el registro, excepto admin

---

## 🎯 Criterios de Aceptación

Una funcionalidad se considera **probada y funcional** cuando:
- ✅ Se ejecuta sin errores en consola
- ✅ Los datos se guardan correctamente en Firestore
- ✅ La UI se actualiza correctamente
- ✅ Los mensajes de éxito/error son claros
- ✅ La navegación funciona correctamente
- ✅ Los estados de carga se muestran apropiadamente

---

**Última actualización**: 2024  
**Versión de la aplicación**: 0.1.0



