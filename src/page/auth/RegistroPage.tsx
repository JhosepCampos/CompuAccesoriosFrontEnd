import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  registrarUsuario,
  guardarSesion,
} from '../../service/usuarioService'

export default function RegistroPage() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState<string>('')
  const [correo, setCorreo] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmarPassword, setConfirmarPassword] = useState<string>('')
  const [cargando, setCargando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cargando) return

    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    setError(null)

    try {

      const nuevoCliente = await registrarUsuario({
        nombre: nombre.trim(),
        correo: correo.trim(),
        password,
        rol: { id: 3, nombre: 'CLIENTE' },
        activo: true,
      })

      guardarSesion(nuevoCliente)
      navigate('/catalogo')
      window.location.reload()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al registrar cuenta'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Crear Cuenta</h2>
          <p className="text-sm text-slate-500">
            Regístrate como cliente en <strong>CompuAccesorios</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegistro} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Ana Flores"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              placeholder="ana@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
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
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              required
              minLength={4}
              placeholder="••••••••"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className={`w-full py-2.5 rounded-lg font-semibold text-white transition cursor-pointer ${
              cargando
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {cargando ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          ¿Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-semibold"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
