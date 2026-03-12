import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, Sparkles, Plus, Trash2, Save, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface IExercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  notes?: string;
}

interface ExerciseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: {
    _id: string;
    title: string;
    exercises: IExercise[];
  } | null;
  onUpdate: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  isOpen,
  onClose,
  routine,
  onUpdate
}) => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<IExercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [aiText, setAiText] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  // Manual entry state
  const [newExercise, setNewExercise] = useState<IExercise>({
    name: '',
    sets: undefined,
    reps: undefined,
    weight: undefined,
    duration: undefined,
    notes: ''
  });

  useEffect(() => {
    if (routine) {
      setExercises(routine.exercises || []);
    }
  }, [routine]);

  const handleAddManual = () => {
    if (!newExercise.name) {
      toast.error('El nombre del ejercicio es obligatorio');
      return;
    }
    setExercises([...exercises, { ...newExercise }]);
    setNewExercise({
      name: '',
      sets: undefined,
      reps: undefined,
      weight: undefined,
      duration: undefined,
      notes: ''
    });
    toast.success('Ejercicio añadido');
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleParseAi = async () => {
    if (!aiText.trim()) {
      toast.error('Escribe algo sobre tu entrenamiento');
      return;
    }
    setIsParsing(true);
    try {
      const res = await fetch(`${API_URL}/api/routines/parse-exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ text: aiText })
      });
      if (!res.ok) throw new Error('Error al procesar el texto');
      const data = await res.json();
      
      setExercises([...exercises, ...data.exercises]);
      setAiText('');
      setShowAiInput(false);
      toast.success('¡Entrenamiento analizado con éxito!');
    } catch (error) {
      toast.error('No se pudo analizar el texto');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!routine) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/routines/${routine._id}/exercises`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ exercises })
      });
      if (res.ok) {
        toast.success('Rutina actualizada');
        onUpdate();
        onClose();
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar los ejercicios');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!routine) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[70] p-4 max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="glass-card rounded-3xl overflow-hidden relative flex flex-col h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-violet-500" />
              
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Dumbbell className="w-6 h-6 text-cyan-400" />
                      Detalles de: {routine.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Configura los ejercicios y detalles de esta rutina</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                  {/* Current Exercises List */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      Ejercicios Actuales ({exercises.length})
                    </h3>
                    {exercises.length === 0 ? (
                      <div className="text-center py-8 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                        <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-slate-500">No hay ejercicios registrados</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {exercises.map((ex, idx) => (
                          <motion.div
                            key={idx}
                            layout
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 group"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-bold text-white">{ex.name}</p>
                              <div className="flex gap-3 mt-1 text-[11px] text-slate-400">
                                {ex.sets && <span>{ex.sets} series</span>}
                                {ex.reps && <span>{ex.reps} reps</span>}
                                {ex.weight && <span>{ex.weight} kg</span>}
                                {ex.duration && <span>{ex.duration} min</span>}
                                {ex.notes && <span className="italic">"{ex.notes}"</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveExercise(idx)}
                              className="p-1.5 text-slate-50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Parser Section */}
                  <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <button
                      onClick={() => setShowAiInput(!showAiInput)}
                      className="w-full p-4 flex justify-between items-center hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-tr from-cyan-400 to-violet-500 p-2 rounded-lg">
                          <Wand2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">Analizar con IA</p>
                          <p className="text-[10px] text-slate-500">Pega tu descripción del entrenamiento</p>
                        </div>
                      </div>
                      {showAiInput ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    
                    <AnimatePresence>
                      {showAiInput && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 overflow-hidden"
                        >
                          <textarea
                            value={aiText}
                            onChange={(e) => setAiText(e.target.value)}
                            placeholder="Ej: Hoy hice 20 min de caminata, luego 4 series de prensa con 180kg y 3 de curl femoral..."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-h-[100px] resize-none mb-3"
                          />
                          <button
                            onClick={handleParseAi}
                            disabled={isParsing || !aiText.trim()}
                            className="w-full py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/10"
                          >
                            {isParsing ? (
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                              <><Sparkles className="w-3.5 h-3.5" /> Procesar con IA</>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Manual Entry Form */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                       Añadir Manualmente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 uppercase ml-1 block mb-1">Nombre</label>
                        <input
                          type="text"
                          value={newExercise.name}
                          onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                          placeholder="Ej: Press de Banca"
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase ml-1 block mb-1">Series</label>
                        <input
                          type="number"
                          value={newExercise.sets || ''}
                          onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="0"
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase ml-1 block mb-1">Reps</label>
                        <input
                          type="number"
                          value={newExercise.reps || ''}
                          onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="0"
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase ml-1 block mb-1">Peso (kg)</label>
                        <input
                          type="number"
                          value={newExercise.weight || ''}
                          onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="0"
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase ml-1 block mb-1">Duración (min)</label>
                        <input
                          type="number"
                          value={newExercise.duration || ''}
                          onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="0"
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 uppercase ml-1 block mb-1">Notas</label>
                        <input
                          type="text"
                          value={newExercise.notes}
                          onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                          placeholder="Ej: Focus en la negativa"
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAddManual}
                      className="w-full mt-3 py-2.5 border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-slate-300 hover:text-cyan-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Añadir Ejercicio
                    </button>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-6 border-t border-slate-800 shrink-0 mt-auto">
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="flex-[2] py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/20 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Save className="w-5 h-5" /> Guardar Todos los Cambios</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
