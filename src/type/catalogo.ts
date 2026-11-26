export interface Categoria {
  id: number
  nombre: string
  activo: boolean
}

export interface Marca {
  id: number
  nombre: string
  activo: boolean
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  descripcion?: string
  categoria: Categoria
  marca: Marca
  precio: number
  stockMinimo: number
  activo: boolean
  imagen: string
  stockFisico?: number
  reservado?: number
}
