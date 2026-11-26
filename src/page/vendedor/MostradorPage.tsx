import { useEffect, useState } from 'react'
import { obtenerProductos } from '../../service/catalogoService'
import { registrarVentaMostrador } from '../../service/ventaService'
import type { Producto } from '../../type/catalogo'
import type { DetalleVentaDto, VentaMostradorRequest } from '../../type/venta'
import { obtenerSesion } from '../../service/usuarioService'

export default function MostradorPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState<string>('')
  const [ticket, setTicket] = useState<DetalleVentaDto[]>([])
  const [montoRecibido, setMontoRecibido] = useState<string>('')
  const [cargando, setCargando] = useState<boolean>(true)
  const [procesando, setProcesando] = useState<boolean>(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const usuarioLogueado = obtenerSesion()
  const vendedorIdActual = usuarioLogueado?.id ?? 0


  const cargarProductos = () => {
    setCargando(true)
    setError(null)
    obtenerProductos()
      .then((data) => setProductos(data.filter((p) => p.activo)))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar productos'
        setError(
          msg === 'Failed to fetch'
            ? 'No hay conexión con el servidor en este momento. Intenta nuevamente.'
            : msg
        )
      })
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.sku.toLowerCase().includes(busqueda.toLowerCase())
  )

  const agregarAlTicket = (producto: Producto) => {
    setError(null)
    setMensajeExito(null)

    const tieneDatosStock =
      producto.stockFisico !== undefined && producto.reservado !== undefined
    const stockDisponible = tieneDatosStock
      ? producto.stockFisico! - producto.reservado!
      : Infinity

    const existente = ticket.find((item) => item.producto.id === producto.id)
    const cantidadActual = existente ? existente.cantidad : 0

    if (cantidadActual + 1 > stockDisponible) {
      setError(
        `Stock insuficiente para "${producto.nombre}". Disponible: ${stockDisponible}`
      )
      return
    }

    if (existente) {
      setTicket((prev) =>
        prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      )
    } else {
      setTicket((prev) => [
        ...prev,
        { producto, cantidad: 1, precio: Number(producto.precio) },
      ])
    }
  }

  const cambiarCantidad = (productoId: number, nuevaCantidad: number) => {
    setError(null)
    const cantidadValida = Math.max(1, nuevaCantidad || 1)
    const itemActual = ticket.find((i) => i.producto.id === productoId)
    if (!itemActual) return

    const { producto } = itemActual
    const tieneDatosStock =
      producto.stockFisico !== undefined && producto.reservado !== undefined
    const stockDisponible = tieneDatosStock
      ? producto.stockFisico! - producto.reservado!
      : Infinity

    if (cantidadValida > stockDisponible) {
      setError(
        `Stock insuficiente para "${producto.nombre}". Disponible: ${stockDisponible}`
      )
      return
    }

    setTicket((prev) =>
      prev.map((item) =>
        item.producto.id === productoId
          ? { ...item, cantidad: cantidadValida }
          : item
      )
    )
  }

  const quitarDelTicket = (productoId: number) => {
    setTicket((prev) => prev.filter((item) => item.producto.id !== productoId))
  }

  const totalVenta = ticket.reduce(
    (acc, item) => acc + Number(item.precio) * item.cantidad,
    0
  )

  const recibidoNum = Number(montoRecibido) || 0
  const vuelto = recibidoNum - totalVenta

  const handleFinalizarVenta = async () => {
    if (ticket.length === 0 || procesando) return

    if (!vendedorIdActual) {
      setError('Debes iniciar sesión como vendedor para registrar la venta.')
      return
    }

    setProcesando(true)
    setError(null)
    setMensajeExito(null)

    const payload: VentaMostradorRequest = {
      vendedorId: vendedorIdActual,
      items: ticket,
    }

    try {
      const ventaRegistrada = await registrarVentaMostrador(payload)
      setTicket([])
      setMontoRecibido('')
      setMensajeExito(
        `¡Venta #${ventaRegistrada.id} cobrada por S/ ${Number(
          ventaRegistrada.total ?? totalVenta
        ).toFixed(2)}!`
      )
      cargarProductos()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar venta'
      setError(
        msg === 'Failed to fetch'
          ? 'No hay conexión con el servidor. No se pudo cobrar la venta.'
          : msg
      )
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Punto de Venta (Mostrador)
        </h2>
        <p className="text-sm text-slate-500">
          Venta directa rápida sin cuenta de cliente
        </p>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-lg font-medium">
          {mensajeExito}
        </div>
      )}

      {error && (
        <div
          className={`flex items-center justify-between p-4 rounded-lg shadow-sm border border-l-4 ${
            error.toLowerCase().includes('stock')
              ? 'bg-amber-50 border-amber-300 border-l-amber-500 text-amber-900'
              : 'bg-red-100 border-red-300 border-l-red-500 text-red-700'
          }`}
        >
          <div>
            {error.toLowerCase().includes('stock') ? (
              <>
                <span className="font-bold mr-1.5">Stock insuficiente:</span>
                <span>
                  {error.replace('Stock insuficiente para venta en mostrador de: ', '')}
                </span>
              </>
            ) : (
              <span>{error}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-bold px-2 cursor-pointer opacity-75 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <input
            type="text"
            placeholder="Buscar producto por nombre o SKU..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />

          {cargando ? (
            <p className="text-slate-500 text-center py-8">Cargando productos...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {productosFiltrados.map((prod) => {
                const tieneDatosStock =
                  prod.stockFisico !== undefined && prod.reservado !== undefined
                const stockDisp = tieneDatosStock
                  ? prod.stockFisico! - prod.reservado!
                  : null
                const agotado = tieneDatosStock ? stockDisp! <= 0 : false

                return (
                  <button
                    key={prod.id}
                    type="button"
                    disabled={agotado}
                    onClick={() => agregarAlTicket(prod)}
                    className={`text-left p-3.5 rounded-lg border transition flex flex-col justify-between ${agotado
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer'
                      }`}
                  >
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                        <span className="font-mono">{prod.sku}</span>
                        {tieneDatosStock && (
                          <span
                            className={
                              agotado ? 'text-red-500 font-semibold' : 'text-emerald-600'
                            }
                          >
                            Disp: {stockDisp}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800 text-sm line-clamp-2">
                        {prod.nombre}
                      </p>
                    </div>
                    <p className="text-blue-600 font-bold mt-2">
                      S/ {Number(prod.precio).toFixed(2)}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 border-b pb-2">
              Detalle de Venta
            </h3>

            {ticket.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">
                Haz clic en los productos de la izquierda para agregarlos a la venta.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {ticket.map((item) => (
                  <div
                    key={item.producto.id}
                    className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {item.producto.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        S/ {Number(item.precio).toFixed(2)} c/u
                      </p>
                    </div>

                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) =>
                        cambiarCantidad(item.producto.id, Number(e.target.value))
                      }
                      className="w-16 border border-slate-300 rounded px-2 py-1 text-center text-sm bg-white"
                    />

                    <div className="text-right w-20">
                      <p className="text-sm font-semibold text-slate-800">
                        S/ {(Number(item.precio) * item.cantidad).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => quitarDelTicket(item.producto.id)}
                      className="text-red-500 hover:text-red-700 px-1.5 font-bold cursor-pointer"
                      title="Quitar"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center text-lg font-bold text-slate-800">
              <span>Total a Cobrar:</span>
              <span className="text-2xl text-blue-600">
                S/ {totalVenta.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center bg-slate-50 p-3 rounded-lg">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Efectivo Recibido (S/)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.10"
                  placeholder="0.00"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white"
                />
              </div>
              <div className="text-right">
                <span className="block text-xs text-slate-500">Vuelto</span>
                <span
                  className={`text-lg font-bold ${vuelto >= 0 ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                >
                  S/ {vuelto >= 0 ? vuelto.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalizarVenta}
              disabled={ticket.length === 0 || procesando}
              className={`w-full py-3 rounded-lg font-bold text-white transition ${ticket.length === 0 || procesando
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                }`}
            >
              {procesando ? 'Procesando Venta...' : 'Cobrar y Finalizar Venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
