import { useEffect, useState } from 'react'
import { obtenerProductos } from '../../service/catalogoService'
import {
    obtenerTodoElInventario,
    registrarEntradaInventario,
} from '../../service/inventarioService'
import type { Producto } from '../../type/catalogo'
import type {
    InventarioDto,
    MovimientoInventarioRequest,
} from '../../type/inventario'
import { obtenerSesion } from '../../service/usuarioService'

export default function InventarioPage() {
    const [inventarios, setInventarios] = useState<InventarioDto[]>([])
    const [busqueda, setBusqueda] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [mensajeExito, setMensajeExito] = useState<string | null>(null)

    const [modalAbierto, setModalAbierto] = useState<boolean>(false)
    const [productoSeleccionado, setProductoSeleccionado] =
        useState<Producto | null>(null)
    const [cantidadEntrada, setCantidadEntrada] = useState<number>(1)
    const [motivoEntrada, setMotivoEntrada] = useState<string>('')

    const [guardando, setGuardando] = useState<boolean>(false)
    const [soloStockBajo, setSoloStockBajo] = useState<boolean>(false)

    const usuarioLogueado = obtenerSesion()

    const cargarTodoElInventario = async () => {
        setCargando(true)
        setError(null)
        try {
            const [productos, listaInventarios] = await Promise.all([
                obtenerProductos(),
                obtenerTodoElInventario(),
            ])

            const mapaInventario = new Map(
                listaInventarios.map((inv) => [inv.producto.id, inv])
            )

            const listaCompleta: InventarioDto[] = productos.map((prod) => {
                const invExistente = mapaInventario.get(prod.id)
                return invExistente
                    ? { ...invExistente, productoId: prod.id }
                    : {
                        productoId: prod.id,
                        producto: prod,
                        stockFisico: 0,
                        reservado: 0,
                    }
            })

            setInventarios(listaCompleta)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al cargar inventario'
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
        cargarTodoElInventario()
    }, [])

    const abrirModalEntrada = (producto: Producto) => {
        setProductoSeleccionado(producto)
        setCantidadEntrada(1)
        setMotivoEntrada('Compra a proveedor')
        setError(null)
        setMensajeExito(null)
        setModalAbierto(true)
    }

    const cerrarModal = () => {
        setModalAbierto(false)
        setProductoSeleccionado(null)
    }

    const handleRegistrarEntrada = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!productoSeleccionado || guardando) return

        if (cantidadEntrada < 1) {
            setError('La cantidad debe ser mayor o igual a 1.')
            return
        }
        if (!motivoEntrada.trim()) {
            setError('El motivo es obligatorio.')
            return
        }

        setGuardando(true)
        setError(null)

        const payload: MovimientoInventarioRequest = {
            producto: { id: productoSeleccionado.id },
            usuario: { id: usuarioLogueado?.id ?? 1 },
            tipo: 'ENTRADA',
            cantidad: Number(cantidadEntrada),
            motivo: motivoEntrada.trim(),
        }

        try {
            const actualizado = await registrarEntradaInventario(
                productoSeleccionado.id,
                payload
            )

            setInventarios((prev) =>
                prev.map((inv) =>
                    inv.productoId === productoSeleccionado.id
                        ? { ...actualizado, producto: productoSeleccionado }
                        : inv
                )
            )

            setMensajeExito(
                `¡Entrada registrada! +${cantidadEntrada} unidades agregadas a "${productoSeleccionado.nombre}".`
            )
            cerrarModal()
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al registrar entrada'
            setError(
                msg === 'Failed to fetch'
                    ? 'No hay conexión con el servidor. No se pudo registrar la entrada de stock.'
                    : msg
            )
        } finally {
            setGuardando(false)
        }
    }

    const cantidadStockBajo = inventarios.filter(
        (inv) => inv.stockFisico - inv.reservado <= (inv.producto.stockMinimo ?? 3)
    ).length

    const inventariosFiltrados = inventarios.filter((inv) => {
        const coincideTexto =
            inv.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            inv.producto.sku.toLowerCase().includes(busqueda.toLowerCase())

        const disponibleReal = inv.stockFisico - inv.reservado
        const esStockBajo = disponibleReal <= (inv.producto.stockMinimo ?? 3)

        return coincideTexto && (!soloStockBajo || esStockBajo)
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Control de Inventario y Almacén
                    </h2>
                    <p className="text-sm text-slate-500">
                        Existencias físicas, reservas activas y entradas de mercadería
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setSoloStockBajo(!soloStockBajo)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold border transition cursor-pointer ${soloStockBajo
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                >
                    ⚠️ Stock Bajo ({cantidadStockBajo})
                </button>

                <input
                    type="text"
                    placeholder="Filtrar por producto o SKU..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white w-full sm:w-64 focus:outline-none focus:border-blue-500"
                />
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
                    Consultando inventario...
                </p>
            ) : error && inventarios.length === 0 ? null : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-800 text-white text-sm">
                            <tr>
                                <th className="p-4">SKU</th>
                                <th className="p-4">Producto</th>
                                <th className="p-4 text-center">Stock Físico</th>
                                <th className="p-4 text-center">Reservado</th>
                                <th className="p-4 text-center">Disponible Real</th>
                                <th className="p-4 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                            {inventariosFiltrados.map((inv) => {
                                const disponibleReal = inv.stockFisico - inv.reservado
                                const bajoStock = disponibleReal <= (inv.producto.stockMinimo ?? 3)

                                return (
                                    <tr key={inv.productoId} className="hover:bg-slate-50">
                                        <td className="p-4 font-mono text-xs text-slate-500">
                                            {inv.producto.sku}
                                        </td>
                                        <td className="p-4">
                                            <p className="font-semibold text-slate-800">
                                                {inv.producto.nombre}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {inv.producto.marca?.nombre} • {inv.producto.categoria?.nombre}
                                            </p>
                                        </td>
                                        <td className="p-4 text-center font-semibold text-slate-700">
                                            {inv.stockFisico}
                                        </td>
                                        <td className="p-4 text-center text-amber-600 font-medium">
                                            {inv.reservado}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span
                                                className={`px-2.5 py-1 rounded-full font-bold text-xs ${disponibleReal <= 0
                                                    ? 'bg-red-100 text-red-700'
                                                    : bajoStock
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                    }`}
                                            >
                                                {disponibleReal} unid.
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => abrirModalEntrada(inv.producto)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
                                            >
                                                + Entrada Mercadería
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Entrada de Mercadería */}
            {modalAbierto && productoSeleccionado && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-slate-800">
                                Entrada de Mercadería
                            </h3>
                            <button
                                type="button"
                                onClick={cerrarModal}
                                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg text-sm">
                            <p className="text-xs text-slate-500 font-mono">
                                {productoSeleccionado.sku}
                            </p>
                            <p className="font-semibold text-slate-800">
                                {productoSeleccionado.nombre}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-100 text-red-700 p-3 rounded text-xs">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegistrarEntrada} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Cantidad a ingresar *
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    value={cantidadEntrada}
                                    onChange={(e) => setCantidadEntrada(Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Motivo / Documento de ingreso *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Compra Factura F001-234, Ajuste de stock..."
                                    value={motivoEntrada}
                                    onChange={(e) => setMotivoEntrada(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="bg-slate-50 px-3 py-2 rounded-lg text-xs text-slate-600">
                                Registrado por: <strong>{usuarioLogueado?.nombre || 'Administrador'}</strong>
                            </div>


                            <div className="flex justify-end gap-2 pt-2">
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
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                >
                                    {guardando ? 'Guardando...' : 'Registrar Entrada'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
