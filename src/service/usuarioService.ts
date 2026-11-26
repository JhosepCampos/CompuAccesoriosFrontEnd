import type { UsuarioDto } from '../type/usuario'

const API_URL = 'http://localhost:8080/usuarios'
const SESSION_KEY = 'compu_accesorios_usuario'

export const buscarUsuarioPorCorreo = async (
  correo: string
): Promise<UsuarioDto> => {
  const res = await fetch(`${API_URL}/correo/${encodeURIComponent(correo)}`)
  if (!res.ok) {
    throw new Error('Correo no encontrado o usuario inexistente')
  }
  return res.json()
}

export const registrarUsuario = async (
  usuario: UsuarioDto
): Promise<UsuarioDto> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario),
  })
  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al registrar el usuario')
  }
  return res.json()
}

export const listarUsuarios = async (): Promise<UsuarioDto[]> => {
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error('Error al listar usuarios')
  return res.json()
}

// --- Manejo de Sesión en LocalStorage ---
export const guardarSesion = (usuario: UsuarioDto): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario))
}

export const obtenerSesion = (): UsuarioDto | null => {
  const data = localStorage.getItem(SESSION_KEY)
  return data ? JSON.parse(data) : null
}

export const cerrarSesion = (): void => {
  localStorage.removeItem(SESSION_KEY)
}


export const loginUsuario = async (
  correo: string,
  password: string
): Promise<UsuarioDto> => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  })

  if (!res.ok) {
    if (res.status === 401) throw new Error('Correo o contraseña incorrectos.')
    if (res.status === 403) throw new Error('Tu cuenta se encuentra desactivada.')
    throw new Error('Error al iniciar sesión.')
  }

  return res.json()
}
