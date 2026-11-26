import type { Producto, Categoria, Marca } from '../type/catalogo'

const API_URL = 'http://localhost:8080'

export const obtenerProductos = async (): Promise<Producto[]> => {
  const res = await fetch(`${API_URL}/productos`)
  if (!res.ok) throw new Error('Error al cargar productos')
  return res.json()
}

export const obtenerCategorias = async (): Promise<Categoria[]> => {
  const res = await fetch(`${API_URL}/categorias`)
  if (!res.ok) throw new Error('Error al cargar categorías')
  return res.json()
}

export const obtenerMarcas = async (): Promise<Marca[]> => {
  const res = await fetch(`${API_URL}/marcas`)
  if (!res.ok) throw new Error('Error al cargar marcas')
  return res.json()
}

// --- Métodos de Administración para ProductoPage ---
export const obtenerTodosProductos = async (): Promise<Producto[]> => {
  const res = await fetch(`${API_URL}/productos/todos`)
  if (!res.ok) throw new Error('Error al cargar todos los productos')
  return res.json()
}

export const registrarProducto = async (
  producto: Omit<Producto, 'id'>
): Promise<Producto> => {
  const res = await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  })
  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al registrar el producto')
  }
  return res.json()
}

export const actualizarProducto = async (
  id: number,
  producto: Producto
): Promise<Producto> => {
  const res = await fetch(`${API_URL}/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  })
  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al actualizar el producto')
  }
  return res.json()
}

export const desactivarProducto = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/productos/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al desactivar el producto')
  }
}

// --- Métodos para CategoriaMarcaPage ---
export const registrarCategoria = async (
  nombre: string
): Promise<Categoria> => {
  const res = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, activo: true }),
  })
  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al registrar la categoría')
  }
  return res.json()
}

export const registrarMarca = async (nombre: string): Promise<Marca> => {
  const res = await fetch(`${API_URL}/marcas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, activo: true }),
  })
  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al registrar la marca')
  }
  return res.json()
}
