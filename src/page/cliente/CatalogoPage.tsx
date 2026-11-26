import { useEffect, useState } from 'react'
import {
  obtenerProductos,
  obtenerCategorias,
  obtenerMarcas,
} from '../../service/catalogoService'
import type { Producto, Categoria, Marca } from '../../type/catalogo'
import { agregarAlCarrito } from '../../service/pedidoService'

export default function CatalogoPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('')
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>('')
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState<string>('')


  useEffect(() => {
    Promise.all([obtenerProductos(), obtenerCategorias(), obtenerMarcas()])
      .then(([dataProductos, dataCategorias, dataMarcas]) => {
        // Regla de negocio: solo listar registros activos
        setProductos(dataProductos.filter((p) => p.activo))
        setCategorias(dataCategorias.filter((c) => c.activo))
        setMarcas(dataMarcas.filter((m) => m.activo))
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  const productosFiltrados = productos.filter((producto) => {
    const coincideTexto =
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
      (producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)

    const coincideCategoria =
      !categoriaSeleccionada ||
      producto.categoria?.id === Number(categoriaSeleccionada)

    const coincideMarca =
      !marcaSeleccionada || producto.marca?.id === Number(marcaSeleccionada)

    return coincideTexto && coincideCategoria && coincideMarca
  })

  const handleAgregarCarrito = (producto: Producto) => {
    agregarAlCarrito(producto)
    alert(`"${producto.nombre}" se agregó al carrito`)
  }

  if (cargando) {
    return <p className="text-center text-slate-600 py-10">Cargando catálogo...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Catálogo de Productos</h2>

        {/* Filtros de Categoría y Marca */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar accesorio o SKU..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm w-full sm:w-56 focus:outline-none focus:border-blue-500"
          />

          <select
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select
            value={marcaSeleccionada}
            onChange={(e) => setMarcaSeleccionada(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
          >
            <option value="">Todas las marcas</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error} (Verifica CORS en /productos, /categorias y /marcas)
        </div>
      )}

      {/* Grid de tarjetas */}
      {productosFiltrados.length === 0 ? (
        <p className="text-slate-500 text-center py-8">
          No hay productos disponibles con estos filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productosFiltrados.map((producto) => {
            // Si el backend aún no manda stockFisico/reservado, verificamos si vienen definidos
            const tieneDatosStock =
              producto.stockFisico !== undefined && producto.reservado !== undefined
            const stockDisponible = tieneDatosStock
              ? producto.stockFisico! - producto.reservado!
              : null
            const sinStock = tieneDatosStock ? stockDisponible! <= 0 : false

            // Si imagen es "general" o vacía, mostramos imagen por defecto
            const urlImagen =
              producto.imagen && producto.imagen !== 'general'
                ? producto.imagen
                : 'https://placeholder.com'

            return (
              <div
                key={producto.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img
                    src={urlImagen}
                    alt={producto.nombre}
                    className="w-full h-44 object-cover bg-slate-100"
                  />

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {producto.marca?.nombre} • {producto.categoria?.nombre}
                      </span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        {producto.sku}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-800 line-clamp-2">
                      {producto.nombre}
                    </h3>

                    {producto.descripcion && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {producto.descripcion}
                      </p>
                    )}

                    <p className="text-xl font-bold text-blue-600">
                      S/ {Number(producto.precio).toFixed(2)}
                    </p>

                    {tieneDatosStock && (
                      <p
                        className={`text-sm font-medium ${sinStock ? 'text-red-600' : 'text-emerald-600'
                          }`}
                      >
                        {sinStock
                          ? 'Agotado (0 disponibles)'
                          : `Stock disponible: ${stockDisponible}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    disabled={sinStock}
                    onClick={() => handleAgregarCarrito(producto)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition ${sinStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      }`}
                  >
                    {sinStock ? 'Sin stock' : 'Agregar al Carrito'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
