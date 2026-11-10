import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Users, 
  Trash2, 
  Mail, 
  Briefcase, 
  User, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { TeamMember } from '../types';
import { addTeamMember, deleteTeamMember } from '../services/storage';

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onMemberAdded?: (member: TeamMember) => void;
}

const AVATAR_COLORS = [
  { label: 'Azul', value: 'bg-blue-600' },
  { label: 'Esmeralda', value: 'bg-emerald-600' },
  { label: 'Ámbar', value: 'bg-amber-600' },
  { label: 'Púrpura', value: 'bg-purple-600' },
  { label: 'Índigo', value: 'bg-indigo-600' },
  { label: 'Cian', value: 'bg-cyan-600' },
  { label: 'Rosa', value: 'bg-rose-600' },
  { label: 'Pizarra', value: 'bg-slate-600' }
];

export const TeamMembersModal: React.FC<TeamMembersModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  onMemberAdded
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-blue-600');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor ingrese el nombre del responsable.');
      return;
    }
    if (!role.trim()) {
      setError('Por favor ingrese el cargo o rol del responsable.');
      return;
    }

    const newMember = addTeamMember({
      name: name.trim(),
      role: role.trim(),
      email: email.trim() || 'contacto@solucionesintegrales.com.ar',
      avatarColor: selectedColor
    });

    setName('');
    setRole('');
    setEmail('');
    setError('');
    setSuccessMsg(`Responsable "${newMember.name}" agregado con éxito.`);
    setTimeout(() => setSuccessMsg(''), 3000);

    if (onMemberAdded) {
      onMemberAdded(newMember);
    }
  };

  const handleDelete = (id: string, memberName: string) => {
    if (confirm(`¿Desea eliminar a "${memberName}" de los responsables?`)) {
      deleteTeamMember(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Responsables de Cotizaciones
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {teamMembers.length} {teamMembers.length === 1 ? 'registrado' : 'registrados'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Equipo técnico y comercial que figura en presupuestos, pliegos y notificaciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Form to Add New Responsible */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/80">
              <UserPlus className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Agregar Nuevo Responsable
              </h3>
            </div>

            {error && (
              <div className="mb-3 p-2.5 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-3 p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Nombre y Apellido <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ej: Ing. Martín Rossi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Cargo o Especialidad <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ej: Director de Licitaciones"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Correo Electrónico Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="mrossi@solucionesintegrales.com.ar"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Color de Avatar / Distintivo
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {AVATAR_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setSelectedColor(c.value)}
                        className={`w-6 h-6 rounded-full ${c.value} transition flex items-center justify-center ${
                          selectedColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={c.label}
                      >
                        {selectedColor === c.value && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Guardar Responsable</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Existing Responsible Persons */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lista de Responsables Activos ({teamMembers.length})
              </h3>
            </div>

            {teamMembers.length === 0 ? (
              <div className="bg-slate-850/50 border border-dashed border-slate-800 rounded-xl p-8 text-center">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-300 mb-1">
                  No hay responsables registrados
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Agregue arriba a los ingenieros, gerentes o especialistas que firmarán las cotizaciones y licitaciones del sistema.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-slate-850 border border-slate-750/70 rounded-xl p-3 flex items-center justify-between group hover:border-slate-650 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${member.avatarColor || 'bg-slate-700'} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm`}>
                        {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 text-xs truncate">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {member.role}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 p-2 rounded-lg transition ml-2 shrink-0 opacity-70 group-hover:opacity-100"
                      title="Eliminar responsable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Los cambios se guardan automáticamente en el sistema.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
