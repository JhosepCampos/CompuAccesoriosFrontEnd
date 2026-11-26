import { useEffect, useState } from 'react'
import {
    obtenerCategorias,
    obtenerMarcas,
    registrarCategoria,
    registrarMarca,
} from '../../service/catalogoService'
import type { Categoria, Marca } from '../../type/catalogo'

export default function CategoriaMarcaPage() {
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [marcas, setMarcas] = useState<Marca[]>([])
    const [nuevaCategoria, setNuevaCategoria] = useState<string>('')
    const [nuevaMarca, setNuevaMarca] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(true)
    const [guardandoCat, setGuardandoCat] = useState<boolean>(false)
    const [guardandoMarca, setGuardandoMarca] = useState<boolean>(false)
    const [mensajeExito, setMensajeExito] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const cargarListas = async () => {
        setCargando(true)
        setError(null)
        try {
            const [cats, marcs] = await Promise.all([
                obtenerCategorias(),
                obtenerMarcas(),
            ])
            setCategorias(cats)
            setMarcas(marcs)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al cargar datos'
            setError(msg)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargarListas()
    }, [])

    const handleCrearCategoria = async (e: React.FormEvent) => {
        e.preventDefault()
        const nombreLimpio = nuevaCategoria.trim()
        if (!nombreLimpio || guardandoCat) return

        setError(null)
        setMensajeExito(null)

        const duplicado = categorias.some(
            (c) => c.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
        )
        if (duplicado) {
            setError(`La categoría "${nombreLimpio}" ya existe.`)
            return
        }

        setGuardandoCat(true)
        try {
            const creada = await registrarCategoria(nombreLimpio)
            setCategorias((prev) => [...prev, creada])
            setNuevaCategoria('')
            setMensajeExito(`Categoría "${creada.nombre}" registrada con éxito.`)
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : 'Error al registrar categoría'
            setError(msg)
        } finally {
            setGuardandoCat(false)
        }
    }

    const handleCrearMarca = async (e: React.FormEvent) => {
        e.preventDefault()
        const nombreLimpio = nuevaMarca.trim()
        if (!nombreLimpio || guardandoMarca) return

        setError(null)
        setMensajeExito(null)

        const duplicado = marcas.some(
            (m) => m.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
        )
        if (duplicado) {
            setError(`La marca "${nombreLimpio}" ya existe.`)
            return
        }

        setGuardandoMarca(true)
        try {
            const creada = await registrarMarca(nombreLimpio)
            setMarcas((prev) => [...prev, creada])
            setNuevaMarca('')
            setMensajeExito(`Marca "${creada.nombre}" registrada con éxito.`)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al registrar marca'
            setError(msg)
        } finally {
            setGuardandoMarca(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">
                    Categorías y Marcas
                </h2>
                <p className="text-sm text-slate-500">
                    Administración de clasificaciones y fabricantes del catálogo
                </p>
            </div>

            {mensajeExito && (
                <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-lg font-medium">
                    {mensajeExito}
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {cargando ? (
                <p className="text-center text-slate-500 py-10">
                    Cargando categorías y marcas...
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna Izquierda: Categorías */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
                            Categorías ({categorias.length})
                        </h3>

                        <form onSubmit={handleCrearCategoria} className="flex gap-2">
                            <input
                                type="text"
                                required
                                placeholder="Nueva categoría (ej. Teclados)..."
                                value={nuevaCategoria}
                                onChange={(e) => setNuevaCategoria(e.target.value)}
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={guardandoCat}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition cursor-pointer ${guardandoCat
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {guardandoCat ? 'Guardando...' : 'Agregar'}
                            </button>
                        </form>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="p-3 w-16">ID</th>
                                        <th className="p-3">Nombre</th>
                                        <th className="p-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {categorias.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center text-slate-400">
                                                No hay categorías registradas.
                                            </td>
                                        </tr>
                                    ) : (
                                        categorias.map((cat) => (
                                            <tr key={cat.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-mono text-xs text-slate-500">
                                                    {cat.id}
                                                </td>
                                                <td className="p-3 font-medium text-slate-800">
                                                    {cat.nombre}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                        {cat.activo ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Columna Derecha: Marcas */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
                            Marcas ({marcas.length})
                        </h3>

                        <form onSubmit={handleCrearMarca} className="flex gap-2">
                            <input
                                type="text"
                                required
                                placeholder="Nueva marca (ej. Logitech)..."
                                value={nuevaMarca}
                                onChange={(e) => setNuevaMarca(e.target.value)}
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={guardandoMarca}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition cursor-pointer ${guardandoMarca
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {guardandoMarca ? 'Guardando...' : 'Agregar'}
                            </button>
                        </form>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="p-3 w-16">ID</th>
                                        <th className="p-3">Nombre</th>
                                        <th className="p-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {marcas.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center text-slate-400">
                                                No hay marcas registradas.
                                            </td>
                                        </tr>
                                    ) : (
                                        marcas.map((marca) => (
                                            <tr key={marca.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-mono text-xs text-slate-500">
                                                    {marca.id}
                                                </td>
                                                <td className="p-3 font-medium text-slate-800">
                                                    {marca.nombre}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                        {marca.activo ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
