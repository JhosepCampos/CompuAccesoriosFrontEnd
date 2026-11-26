import { useEffect, useState } from 'react'
import { listarUsuarios, registrarUsuario } from '../../service/usuarioService'
import { listarRoles } from '../../service/rolService'
import type { UsuarioDto } from '../../type/usuario'
import type { Rol } from '../../type/rol'

export default function UsuarioPage() {
  const [usuarios, setUsuarios] = useState<UsuarioDto[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [busqueda, setBusqueda] = useState<string>('')
  const [filtroRol, setFiltroRol] = useState<string>('')
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const [modalAbierto, setModalAbierto] = useState<boolean>(false)
  const [nombre, setNombre] = useState<string>('')
  const [correo, setCorreo] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [rolId, setRolId] = useState<string>('')
  const [guardando, setGuardando] = useState<boolean>(false)

  const cargarDatos = async () => {
    setCargando(true)
    setError(null)
    try {
      const [dataUsuarios, dataRoles] = await Promise.all([
        listarUsuarios(),
        listarRoles(),
      ])
      setUsuarios(dataUsuarios)
      setRoles(dataRoles)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar usuarios'
      setError(
        msg === 'Failed to fetch'
          ? 'No hay conexión con el servidor en este momento. Intenta más tarde.'
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
    setNombre('')
    setCorreo('')
    setPassword('')
  
    const rolVendedor = roles.find((r) => r.nombre.toUpperCase() === 'VENDEDOR')
    setRolId(rolVendedor ? String(rolVendedor.id) : roles[0]?.id ? String(roles[0].id) : '')
    setError(null)
    setMensajeExito(null)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
  }

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (guardando) return

    const correoLimpio = correo.trim().toLowerCase()
    const duplicado = usuarios.some(
      (u) => u.correo.trim().toLowerCase() === correoLimpio
    )
    if (duplicado) {
      setError(`Ya existe un usuario registrado con el correo "${correoLimpio}".`)
      return
    }

    const rolSeleccionado = roles.find((r) => r.id === Number(rolId))
    if (!rolSeleccionado) {
      setError('Debes seleccionar un rol válido.')
      return
    }

    setGuardando(true)
    setError(null)

    try {
      const creado = await registrarUsuario({
        nombre: nombre.trim(),
        correo: correoLimpio,
        password,
        rol: rolSeleccionado,
        activo: true,
      })
      setUsuarios((prev) => [...prev, creado])
      setMensajeExito(
        `Usuario "${creado.nombre}" creado con rol ${rolSeleccionado.nombre}.`
      )
      cerrarModal()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear usuario'
      setError(
        msg === 'Failed to fetch'
          ? 'No hay conexión con el servidor en este momento. Intenta más tarde.'
          : msg
      )
    } finally {
      setGuardando(false)
    }
  }

  const obtenerBadgeRol = (nombreRol?: string) => {
    switch (nombreRol?.toUpperCase()) {
      case 'ADMINISTRADOR':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'VENDEDOR':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'CLIENTE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300'
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideTexto =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase())
    const coincideRol = !filtroRol || u.rol?.id === Number(filtroRol)
    return coincideTexto && coincideRol
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Gestión de Usuarios y Personal
          </h2>
          <p className="text-sm text-slate-500">
            Administradores, vendedores y clientes registrados en el sistema
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border border-slate-300 rounded-lg px-3.5 py-2 text-sm bg-white w-56 focus:outline-none focus:border-blue-500"
          />

          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={abrirModalNuevo}
            disabled={cargando || Boolean(error && !modalAbierto)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition"
          >
            + Nuevo Usuario
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
          Cargando lista de usuarios...
        </p>
      ) : error && !modalAbierto ? null : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="p-4 w-16">ID</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Correo Electrónico</th>
                <th className="p-4 text-center">Rol</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No se encontraron usuarios con esos filtros.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {u.id}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {u.nombre}
                    </td>
                    <td className="p-4 text-slate-600">{u.correo}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${obtenerBadgeRol(
                          u.rol?.nombre
                        )}`}
                      >
                        {u.rol?.nombre || 'SIN ROL'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.activo !== false
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear Nuevo Usuario */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                Registrar Nuevo Usuario
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

            <form onSubmit={handleCrearUsuario} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="carlos@compuaccesorios.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rol Asignado *
                </label>
                <select
                  required
                  value={rolId}
                  onChange={(e) => setRolId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Seleccione un rol...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>

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
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer ${
                    guardando
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {guardando ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
