import type { Rol } from '../type/rol'

const API_URL = 'http://localhost:8080/roles'

export const listarRoles = async (): Promise<Rol[]> => {
  const response = await fetch(API_URL)
  if (!response.ok) {
    throw new Error('Error al obtener los roles')
  }
  return response.json()
}
