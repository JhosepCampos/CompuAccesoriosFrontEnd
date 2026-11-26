import type { Rol } from './rol'

export interface UsuarioDto {
  id?: number
  nombre: string
  correo: string
  password?: string
  rol: Rol
  activo?: boolean
}
