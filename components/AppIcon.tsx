"use client"

import { cn } from "@/lib/utils"

export const UI_ICONS = {
  agenda: "/Interfaz/01_Agenda_inactivo.jpg",
  inicio: "/Interfaz/02_Inicio_inactivo.jpg",
  perfil: "/Interfaz/03_Perfil_inactivo.jpg",
  notificacionesInactivo: "/Interfaz/04_Notificaciones_inactivo.jpg",
  notificacionesActivo: "/Interfaz/05_Notificaciones_activo.jpg",
  cerrarSesion: "/Interfaz/06_Cerrar_sesion.jpg",
  estadisticas: "/Interfaz/07_Estadisticas.jpg",
  agregarServicio: "/Interfaz/08_Agregar_servicio_o_comercio.jpg",
  ayuda: "/Interfaz/09_Ayuda.jpg",
  trabajo: "/Interfaz/10_Trabajo_o_profesion.jpg",
  datosPago: "/Interfaz/11_Datos_de_pago_o_tarjeta.jpg",
  seguridad: "/Interfaz/12_Seguridad_o_contrasena.jpg",
  ubicacion: "/Interfaz/13_Ubicacion.jpg",
  trabajoVariante: "/Interfaz/14_Trabajo_o_profesion_variante.jpg",
  usuarios: "/Interfaz/15_Usuarios_o_clientes.jpg",
  favoritos: "/Interfaz/16_Favoritos_o_calificacion.jpg",
  telefono: "/Interfaz/17_Telefono.jpg",
  fechaNacimiento: "/Interfaz/18_Fecha_de_nacimiento.jpg",
  correo: "/Interfaz/19_Correo_electronico.jpg",
  configuracion: "/Interfaz/20_Configuracion.jpg",
  camara: "/Interfaz/21_Camara_foto_de_perfil.jpg",
  chat: "/Interfaz/22_Chat_inactivo.svg",
} as const

export type UiIconName = keyof typeof UI_ICONS

type AppIconProps = {
  name: UiIconName
  className?: string
  /** Si true, opacidad plena; si false, más apagado (para nav). */
  active?: boolean
  alt?: string
}

/** Iconos de marca desde /public/Interfaz */
export function AppIcon({ name, className, active = true, alt = "" }: AppIconProps) {
  return (
    <img
      src={UI_ICONS[name]}
      alt={alt}
      draggable={false}
      className={cn(
        "object-contain select-none pointer-events-none rounded-sm",
        active ? "opacity-100" : "opacity-45",
        className
      )}
    />
  )
}
