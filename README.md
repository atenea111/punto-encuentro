# Punto Encuentro - Plataforma de Servicios Locales

## 📋 Descripción

Punto Encuentro es una plataforma web que conecta clientes con proveedores de servicios locales. Permite a los usuarios buscar, reservar y gestionar servicios, mientras que los proveedores pueden crear, administrar y promocionar sus servicios.

## 🚀 Tecnologías Utilizadas

### Frontend
- **Next.js 15.2.4** - Framework React con App Router
- **React 19** - Biblioteca de UI
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 4.1.9** - Framework de estilos
- **Shadcn UI** - Componentes de UI
- **Lucide React** - Iconos

### Backend y Base de Datos
- **Firebase Authentication** - Autenticación de usuarios
- **Firebase Firestore** - Base de datos NoSQL
- **Firebase Storage** - Almacenamiento de imágenes (preparado)

### Herramientas
- **Capacitor 7.4.3** - Para desarrollo móvil
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

## 📁 Estructura del Proyecto

```
punto-encuentro/
├── app/
│   ├── globals.css          # Estilos globales
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página principal (todos los flujos)
├── components/
│   ├── ui/                  # Componentes de UI (Shadcn)
│   ├── CustomAlert.tsx      # Componente de alertas
│   └── theme-provider.tsx    # Proveedor de temas
├── hooks/
│   ├── useAuth.ts           # Hook de autenticación
│   ├── useServices.ts         # Hook de servicios
│   ├── useBookings.ts       # Hook de reservas
│   ├── useUsers.ts          # Hook de usuarios
│   ├── useCategories.ts     # Hook de categorías
│   ├── useRoles.ts          # Hook de roles
│   ├── useAnalytics.ts      # Hook de analíticas
│   ├── useAdminDashboard.ts # Hook del dashboard admin
│   └── useReports.ts        # Hook de informes
├── lib/
│   ├── firebase.ts          # Configuración de Firebase
│   └── utils.ts             # Utilidades
├── public/                  # Archivos estáticos
├── scripts/                 # Scripts de utilidad
└── next.config.js           # Configuración de Next.js
```

## 🎨 Paleta de Colores

La aplicación utiliza una paleta de colores personalizada basada en el documento de diseño:

- **Color Primario (Petróleo)**: `oklch(0.35 0.08 200)`
- **Color Naranja**: `oklch(0.65 0.18 45)` - Para botones rectangulares
- **Fondo**: `oklch(0.98 0.01 200)` - Fondo con baja opacidad de petróleo
- **Tarjetas**: Fondo blanco

## 👥 Roles de Usuario

### 1. Cliente
- Buscar servicios por categoría o término
- Ver detalles de servicios
- Reservar turnos
- Gestionar reservas (ver, cancelar)
- Editar perfil
- Subir foto de perfil

### 2. Proveedor
- Crear y gestionar servicios
- Activar/desactivar servicios
- Ver y gestionar reservas
- Confirmar/cancelar reservas
- Ver estadísticas de negocio
- Editar perfil completo
- Subir fotos de perfil y portada
- Suscripción Premium (opcional)

### 3. Administrador
- Dashboard con métricas clave
- Gestión de usuarios
- Gestión de categorías
- Gestión de servicios
- Ver analíticas
- Generar informes (diarios, semanales, mensuales)
- Panel de alertas

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o pnpm
- Cuenta de Firebase

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd punto-encuentro
```

2. **Instalar dependencias**
```bash
npm install
# o
pnpm install
```

3. **Configurar Firebase**

Crear un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

4. **Configurar Firestore**

En Firebase Console, crear las siguientes colecciones:
- `users` - Usuarios del sistema
- `services` - Servicios ofrecidos
- `bookings` - Reservas
- `categories` - Categorías de servicios
- `analytics` - Datos de analíticas (opcional)

### Estructura de Datos en Firestore

#### Colección: `users`
```typescript
{
  email: string
  displayName: string
  role: 'client' | 'provider' | 'admin'
  permissions: string[]
  isActive: boolean
  isVerified?: boolean  // Solo para proveedores
  phone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}
```

#### Colección: `services`
```typescript
{
  name: string
  description: string
  price: number
  category: string
  providerId: string
  providerName: string
  rating: number
  reviews: number
  image?: string
  duration?: string
  active?: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### Colección: `bookings`
```typescript
{
  serviceId: string
  serviceName: string
  clientId: string
  clientName: string
  clientEmail: string
  providerId: string
  providerName: string
  date: string  // Formato: YYYY-MM-DD
  time: string
  price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentMethod: 'cash' | 'mercadopago' | 'transfer'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  createdAt: Date
  updatedAt: Date
}
```

#### Colección: `categories`
```typescript
{
  name: string
  description?: string
  icon?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo en http://localhost:3000

# Producción
npm run build        # Construye la aplicación para producción
npm run start        # Inicia servidor de producción

# Linting
npm run lint         # Ejecuta el linter
```

## 📱 Funcionalidades Principales

### Para Clientes

1. **Búsqueda y Exploración**
   - Búsqueda por término
   - Filtrado por categorías
   - Vista de servicios recomendados
   - Vista de servicios cercanos

2. **Reservas**
   - Selección de fecha y hora
   - Métodos de pago (Efectivo, MercadoPago, Transferencia)
   - Confirmación de reserva
   - Gestión de reservas en agenda

3. **Perfil**
   - Edición de datos personales
   - Subida de foto de perfil
   - Visualización de reservas

### Para Proveedores

1. **Gestión de Servicios**
   - Crear servicios
   - Editar servicios
   - Activar/desactivar servicios
   - Eliminar servicios

2. **Gestión de Reservas**
   - Ver todas las reservas
   - Confirmar reservas pendientes
   - Cancelar reservas
   - Vista de calendario

3. **Dashboard**
   - Estadísticas de clientes únicos
   - Ingresos totales
   - Próximos turnos
   - Lista de servicios

4. **Estadísticas**
   - Visualizaciones
   - Reservas totales
   - Ingresos
   - Tasa de conversión
   - Rendimiento por servicio

5. **Suscripción Premium**
   - Planes mensual y anual
   - Beneficios adicionales

### Para Administradores

1. **Dashboard**
   - Usuarios activos hoy
   - Nuevos usuarios esta semana
   - Comercios activos
   - Comercios pendientes de verificación
   - Publicaciones nuevas/pendientes/denunciadas
   - Cantidad de chats iniciados
   - Top 5 búsquedas del día
   - Panel de alertas

2. **Gestión**
   - Usuarios (crear, editar, eliminar, cambiar roles)
   - Categorías (crear, editar, activar/desactivar)
   - Servicios (ver, editar, eliminar)
   - Analíticas

3. **Informes**
   - **Diarios**: Usuarios activos, publicaciones nuevas, chats iniciados, denuncias
   - **Semanales**: Ranking de búsquedas por ciudad, promociones con mejor/peor rendimiento
   - **Mensuales**: Crecimiento general, retención de usuarios, resumen de promociones

## 🔐 Autenticación

La aplicación utiliza Firebase Authentication con los siguientes métodos:
- Email y contraseña
- Registro automático con rol asignado
- Persistencia de sesión

### Flujo de Registro

1. **Cliente**: Se registra → Rol 'client' asignado automáticamente
2. **Proveedor**: Se registra → Rol 'provider' asignado, requiere verificación del admin
3. **Admin**: Debe ser creado manualmente o mediante script

## 🎯 Hooks Personalizados

### `useAuth`
Maneja la autenticación de usuarios:
- `signUp(email, password)` - Registro
- `signIn(email, password)` - Login
- `logout()` - Cerrar sesión

### `useServices`
Gestiona los servicios:
- `createService(serviceData)` - Crear servicio
- `updateService(id, data)` - Actualizar servicio
- `deleteService(id)` - Eliminar servicio
- `searchServices(term)` - Buscar servicios

### `useBookings`
Gestiona las reservas:
- `createBooking(bookingData)` - Crear reserva
- `updateBooking(id, data)` - Actualizar reserva
- `cancelBooking(id)` - Cancelar reserva
- `getBookingsByClient(clientId)` - Reservas del cliente
- `getBookingsByProvider(providerId)` - Reservas del proveedor

### `useUsers`
Gestiona usuarios (admin):
- `updateUserRole(id, role)` - Cambiar rol
- `toggleUserStatus(id)` - Activar/desactivar usuario
- `deleteUser(id)` - Eliminar usuario
- `getUsersByRole(role)` - Filtrar por rol

### `useAdminDashboard`
Dashboard del administrador:
- `stats` - Estadísticas generales
- `refresh()` - Actualizar datos

### `useReports`
Generación de informes:
- `generateDailyReport()` - Informe diario
- `generateWeeklyReport()` - Informe semanal
- `generateMonthlyReport()` - Informe mensual

## 🎨 Componentes UI Principales

La aplicación utiliza componentes de Shadcn UI:
- `Button` - Botones con variantes (default, outline, ghost, destructive, orange)
- `Card` - Tarjetas de contenido
- `Input` - Campos de entrada
- `Label` - Etiquetas
- `CustomAlert` - Alertas personalizadas

## 📊 Estado de la Aplicación

### ✅ Funcionalidades Completadas

- [x] Autenticación completa (cliente, proveedor, admin)
- [x] Búsqueda y filtrado de servicios
- [x] Sistema de reservas completo
- [x] Gestión de servicios para proveedores
- [x] Dashboard de administrador
- [x] Sistema de informes
- [x] Estadísticas para proveedores
- [x] Edición de perfiles
- [x] Subida de imágenes de perfil
- [x] Gestión de categorías
- [x] Panel de alertas

### 🔄 Funcionalidades Pendientes

- [ ] Integración real con Firebase Storage para imágenes
- [ ] Sistema de notificaciones push
- [ ] Chat entre cliente y proveedor
- [ ] Sistema de pagos real (MercadoPago)
- [ ] Geolocalización para servicios cercanos
- [ ] Sistema de reseñas y calificaciones
- [ ] Notificaciones por email

## 🐛 Solución de Problemas

### Error: "ENOENT: no such file or directory, open 'out/server/...'"
Este error ocurre cuando se ejecuta `next dev` con `output: 'export'` activado. La configuración ya está corregida para usar export solo en producción.

### Error de autenticación
Verificar que las variables de entorno de Firebase estén correctamente configuradas en `.env.local`.

### Error al cargar servicios
Verificar que la colección `services` exista en Firestore y tenga los índices necesarios.

## 📝 Notas de Desarrollo

- La aplicación está configurada para exportación estática en producción
- Las imágenes se suben temporalmente (URL.createObjectURL) - pendiente integración con Firebase Storage
- Los roles de usuario se guardan en Firestore en la colección `users`
- Los proveedores requieren verificación del admin antes de estar completamente activos

## 🤝 Contribución

Para contribuir al proyecto:
1. Crear una rama desde `main`
2. Realizar los cambios
3. Probar exhaustivamente
4. Crear un Pull Request

## 📄 Licencia

Este proyecto es privado y propiedad de Punto Encuentro.

## 📞 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

**Versión**: 0.1.0  
**Última actualización**: 2024

