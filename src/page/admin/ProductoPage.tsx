import { useEffect, useState } from 'react'
import {
  obtenerTodosProductos,
  obtenerCategorias,
  obtenerMarcas,
  registrarProducto,
  actualizarProducto,
  desactivarProducto,
} from '../../service/catalogoService'
import type { Producto, Categoria, Marca } from '../../type/catalogo'

export default function ProductoPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [busqueda, setBusqueda] = useState<string>('')
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const [modalAbierto, setModalAbierto] = useState<boolean>(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(
    null
  )
  const [sku, setSku] = useState<string>('')
  const [nombre, setNombre] = useState<string>('')
  const [descripcion, setDescripcion] = useState<string>('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [marcaId, setMarcaId] = useState<string>('')
  const [precio, setPrecio] = useState<string>('')
  const [stockMinimo, setStockMinimo] = useState<number>(3)
  const [imagen, setImagen] = useState<string>('general')
  const [activo, setActivo] = useState<boolean>(true)
  const [guardando, setGuardando] = useState<boolean>(false)

  const cargarDatos = async () => {
    setCargando(true)
    setError(null)
    try {
      const [prods, cats, marcs] = await Promise.all([
        obtenerTodosProductos(),
        obtenerCategorias(),
        obtenerMarcas(),
      ])
      setProductos(prods)
      setCategorias(cats.filter((c) => c.activo))
      setMarcas(marcs.filter((m) => m.activo))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos'
      setError(
        msg === 'Failed to fetch'
          ? 'No hay conexión con el servidor en este momento. Intenta nuevamente.'
          : msg
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const abrirModalNuevo = () => {
    setProductoEditando(null)
    setSku('')
    setNombre('')
    setDescripcion('')
    setCategoriaId(categorias[0]?.id ? String(categorias[0].id) : '')
    setMarcaId(marcas[0]?.id ? String(marcas[0].id) : '')
    setPrecio('')
    setStockMinimo(3)
    setImagen('general')
    setActivo(true)
    setError(null)
    setMensajeExito(null)
    setModalAbierto(true)
  }

  const abrirModalEditar = (prod: Producto) => {
    setProductoEditando(prod)
    setSku(prod.sku)
    setNombre(prod.nombre)
    setDescripcion(prod.descripcion || '')
    setCategoriaId(prod.categoria?.id ? String(prod.categoria.id) : '')
    setMarcaId(prod.marca?.id ? String(prod.marca.id) : '')
    setPrecio(String(prod.precio))
    setStockMinimo(prod.stockMinimo ?? 3)
    setImagen(prod.imagen || 'general')
    setActivo(prod.activo)
    setError(null)
    setMensajeExito(null)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setProductoEditando(null)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (guardando) return

    const catObj = categorias.find((c) => c.id === Number(categoriaId))
    const marcaObj = marcas.find((m) => m.id === Number(marcaId))

    if (!catObj || !marcaObj) {
      setError('Debes seleccionar una categoría y una marca válidas.')
      return
    }

    setGuardando(true)
    setError(null)

    const datosProducto = {
      sku: sku.trim(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoria: catObj,
      marca: marcaObj,
      precio: Number(precio),
      stockMinimo: Number(stockMinimo),
      activo,
      imagen: imagen.trim() || 'general',
    }

    try {
      if (productoEditando) {
        await actualizarProducto(productoEditando.id, {
          ...datosProducto,
          id: productoEditando.id,
        })
        setMensajeExito(`Producto "${datosProducto.nombre}" actualizado.`)
      } else {
        await registrarProducto(datosProducto)
        setMensajeExito(`Producto "${datosProducto.nombre}" registrado.`)
      }
      cerrarModal()
      cargarDatos()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setError(
        msg === 'Failed to fetch'
          ? 'No hay conexión con el servidor. No se pudo guardar el producto.'
          : msg
      )
    } finally {
      setGuardando(false)
    }
  }

  const handleDesactivar = async (prod: Producto) => {
    const confirmar = window.confirm(
      `¿Desactivar el producto "${prod.nombre}" (${prod.sku})? Ya no aparecerá en el catálogo público.`
    )
    if (!confirmar) return

    try {
      await desactivarProducto(prod.id)
      setProductos((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, activo: false } : p))
      )
      setMensajeExito(`Producto "${prod.nombre}" desactivado lógicamente.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desactivar'
      setError(
        msg === 'Failed to fetch'
          ? 'No hay conexión con el servidor. No se pudo desactivar el producto.'
          : msg
      )
    }
  }

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.sku.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Mantenimiento de Productos
          </h2>
          <p className="text-sm text-slate-500">
            Catálogo completo (activos e inactivos) y desactivación lógica
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white w-56 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={abrirModalNuevo}
            disabled={cargando || Boolean(error && productos.length === 0)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition"
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-lg font-medium">
          {mensajeExito}
        </div>
      )}

      {error && !modalAbierto && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-center text-slate-500 py-10">
          Cargando catálogo completo...
        </p>
      ) : error && productos.length === 0 ? null : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-white text-sm">
              <tr>
                <th className="p-4">SKU</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría / Marca</th>
                <th className="p-4 text-right">Precio</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {productosFiltrados.map((prod) => (
                <tr
                  key={prod.id}
                  className={
                    prod.activo ? 'hover:bg-slate-50' : 'bg-slate-100/70 opacity-75'
                  }
                >
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {prod.sku}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-slate-800">{prod.nombre}</p>
                    {prod.descripcion && (
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {prod.descripcion}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-xs text-slate-600">
                    <p>{prod.categoria?.nombre}</p>
                    <p className="text-slate-400">{prod.marca?.nombre}</p>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-800">
                    S/ {Number(prod.precio).toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${prod.activo
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {prod.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(prod)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold cursor-pointer"
                    >
                      Editar
                    </button>
                    {prod.activo && (
                      <button
                        type="button"
                        onClick={() => handleDesactivar(prod)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                type="button"
                onClick={cerrarModal}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleGuardar} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. MOU-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio (S/) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    required
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Seleccione...</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marca *
                  </label>
                  <select
                    required
                    value={marcaId}
                    onChange={(e) => setMarcaId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Seleccione...</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Imagen
                  </label>
                  <input
                    type="text"
                    value={imagen}
                    onChange={(e) => setImagen(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {productoEditando && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="checkActivo"
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="checkActivo"
                    className="text-xs font-medium text-slate-700"
                  >
                    Producto Activo (visible en catálogo público)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer ${guardando
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {guardando ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
