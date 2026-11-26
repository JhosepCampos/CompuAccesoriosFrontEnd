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
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([obtenerProductos(), obtenerCategorias(), obtenerMarcas()])
      .then(([dataProductos, dataCategorias, dataMarcas]) => {
        setProductos(dataProductos.filter((p) => p.activo))
        setCategorias(dataCategorias.filter((c) => c.activo))
        setMarcas(dataMarcas.filter((m) => m.activo))
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar el catálogo'
        setError(
          msg === 'Failed to fetch'
            ? 'No pudimos cargar el catálogo en este momento. Por favor, intenta nuevamente en unos segundos.'
            : msg
        )
      })
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

    setToast(`"${producto.nombre}" se agregó al carrito`)
    setTimeout(() => {
      setToast((prev) => (prev === `"${producto.nombre}" se agregó al carrito` ? null : prev))
    }, 2500)
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
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}


      {/* Grid de tarjetas */}
      {error ? null : productosFiltrados.length === 0 ? (
        <p className="text-slate-500 text-center py-8">
          No hay productos disponibles con estos filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productosFiltrados.map((producto) => {
            const tieneDatosStock =
              producto.stockFisico !== undefined && producto.reservado !== undefined
            const stockDisponible = tieneDatosStock
              ? producto.stockFisico! - producto.reservado!
              : null
            const sinStock = tieneDatosStock ? stockDisponible! <= 0 : false

            const SIN_IMAGEN =
              "data:image/svg+xml;utf8,%3Csvg xmlns='http://w3.org' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23e2e8f0' width='600' height='400'/%3E%3Ctext fill='%2364748b' font-family='sans-serif' font-size='28' font-weight='bold' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ESin Imagen%3C/text%3E%3C/svg%3E";


            const urlImagen =
              producto.imagen && producto.imagen !== 'general'
                ? producto.imagen
                : SIN_IMAGEN;

            return (
              <div
                key={producto.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img
                    src={urlImagen}
                    alt={producto.nombre}
                    onError={(e) => {
                      e.currentTarget.src = SIN_IMAGEN;
                    }}
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
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-lg">
          <span className="font-bold">✓</span>
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}
