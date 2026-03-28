import DashboardLayout from "../../components/layout/DashboardLayout"
import { Wrench, Clock, Users } from "lucide-react"

const Team = () => {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-main flex items-center gap-2"><Users size={22} className="text-text-muted" /> Equipo</h1>
        <p className="text-text-muted text-sm mt-1">Gestión de miembros del equipo</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
          <Wrench size={36} className="text-amber-400" />
        </div>
        <h2 className="text-text-main text-xl font-bold mb-2">Sección en mantenimiento</h2>
        <p className="text-text-muted text-sm max-w-xs mb-4">
          Estamos trabajando para mejorar esta área. Vuelve a intentarlo más tarde.
        </p>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
          <Clock size={13} className="text-amber-400" />
          <span className="text-amber-400 text-xs font-medium">Próximamente disponible</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Team
