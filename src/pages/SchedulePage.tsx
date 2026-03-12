import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Flame, Calendar, Dumbbell, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { ExerciseDetailModal } from '../components/dashboard/ExerciseDetailModal';
import { API_URL } from '../config';
import toast from 'react-hot-toast';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const TIME_SLOTS = ['Mañana', 'Tarde', 'Noche'];

export const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [entries, setEntries] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);

  // Add modal state
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('Mañana');
  const [detailRoutine, setDetailRoutine] = useState<any>(null);

  const fetchRoutines = async () => {
    try {
      const res = await fetch(`${API_URL}/api/routines`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) setRoutines(await res.json());
    } catch (error) {
      console.error('Error fetching routines:', error);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`${API_URL}/api/schedule`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) setEntries(await res.json());
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchSchedule();
      fetchRoutines();
    }
  }, [user]);

  const handleAdd = async () => {
    if (!selectedRoutine) {
      toast.error('Selecciona una rutina');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ routineId: selectedRoutine, dayOfWeek: addingDay, timeSlot: selectedTimeSlot }),
      });
      if (res.ok) {
        const newEntry = await res.json();
        setEntries(prev => [...prev, newEntry]);
        toast.success('Rutina programada');
        setAddingDay(null);
        setSelectedRoutine('');
        setSelectedTimeSlot('Mañana');
      }
    } catch (err) {
      toast.error('Error al programar');
    }
  };

  const handleDelete = async (entryId: string) => {
    const ok = await confirm({
      title: 'Quitar del horario',
      message: '¿Quieres quitar esta rutina del día?',
      confirmText: 'Sí, quitar',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      const res = await fetch(`${API_URL}/api/schedule/${entryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (res.ok) {
        setEntries(prev => prev.filter(e => e._id !== entryId));
        toast.success('Entrada eliminada');
      }
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const getEntriesForDay = (dayIndex: number) => {
    return entries.filter(e => e.dayOfWeek === dayIndex);
  };


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-cyan-400" /> Horario Semanal
          </h1>
          <p className="text-slate-400 mt-1">Planifica tus entrenamientos para cada día de la semana</p>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAYS.map((_, dayIndex) => {
          const dayEntries = getEntriesForDay(dayIndex);
          const isToday = new Date().getDay() === (dayIndex + 1) % 7;
          
          return (
            <motion.div
              key={dayIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
              className={`glass-card p-4 flex flex-col rounded-2xl overflow-hidden relative min-h-[220px] ${
                isToday ? 'ring-2 ring-cyan-500/40' : ''
              }`}
            >
              {/* Day gradient top bar */}
              <div className={`absolute top-0 left-0 w-full h-1 ${isToday ? 'bg-gradient-to-r from-cyan-400 to-violet-500' : 'bg-slate-700/50'}`} />
              
              {/* Day header */}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className={`text-sm font-bold ${isToday ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {DAY_SHORT[dayIndex]}
                  </span>
                  {isToday && <span className="ml-2 text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-semibold">HOY</span>}
                </div>
                <button
                  onClick={() => setAddingDay(dayIndex)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 border border-transparent hover:border-cyan-500/30 transition-all"
                  title="Añadir rutina"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Entries */}
              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                {dayEntries.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-6">
                    <p className="text-xs text-slate-600 text-center">Día libre</p>
                  </div>
                ) : (
                  dayEntries.map((entry: any) => (
                    <motion.div
                      key={entry._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/30 group transition-colors flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{entry.routine?.title || 'Sin título'}</p>
                          <div className="flex gap-2 mt-1 text-[10px] text-slate-500">
                            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{entry.routine?.duration}m</span>
                            <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" />{entry.routine?.calories}</span>
                          </div>
                          <span className="text-[10px] text-slate-600 mt-0.5 block">{entry.timeSlot}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-700/30">
                        <p className="text-[10px] text-slate-500 italic">
                          {entry.routine?.exercises?.length || 0} ejercicios
                        </p>
                        <button
                          onClick={() => setDetailRoutine(entry.routine)}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                        >
                          <ClipboardList className="w-3 h-3" /> Detalles
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Routine Modal */}
      <AnimatePresence>
        {addingDay !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddingDay(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[60] p-4"
            >
              <div className="glass-card rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-violet-500" />
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-cyan-400" />
                    Programar para {DAYS[addingDay]}
                  </h3>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Rutina</label>
                    <select
                      value={selectedRoutine}
                      onChange={(e) => setSelectedRoutine(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    >
                      <option value="">Selecciona una rutina...</option>
                      {routines.map((r: any) => (
                        <option key={r._id} value={r._id}>{r.title} ({r.duration}min)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Horario</label>
                    <div className="flex gap-2">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all border ${
                            selectedTimeSlot === slot
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                              : 'bg-transparent text-slate-400 border-slate-700/50 hover:text-white'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setAddingDay(null)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAdd}
                      className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all text-sm"
                    >
                      Programar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ExerciseDetailModal
        isOpen={!!detailRoutine}
        onClose={() => setDetailRoutine(null)}
        routine={detailRoutine}
        onUpdate={() => {
          fetchSchedule();
          fetchRoutines();
        }}
      />
    </motion.div>
  );
};
