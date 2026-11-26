import { useEffect, useState } from 'react'
import { listarRoles } from '../../service/rolService'
import type { Rol } from '../../type/rol'

export default function RolPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarRoles()
      .then((data) => setRoles(data))
      .catch((err) => {
        const msg =
          err.message === 'Failed to fetch'
            ? 'No hay conexión con el servidor en este momento. Intenta más tarde.'
            : err.message
        setError(msg)
      })
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Lista de Roles</h2>

      {error ? (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      ) : (

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Nombre del Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {roles.map((rol) => (
              <tr key={rol.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium">{rol.id}</td>
                <td className="p-3">{rol.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}
