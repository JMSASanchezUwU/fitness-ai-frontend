import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Clock, Flame, Sparkles, PenTool, Bot, Trash2, ListTodo, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

interface RecordActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityAdded: () => void;
}

export const RecordActivityModal: React.FC<RecordActivityModalProps> = ({ isOpen, onClose, onActivityAdded }) => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'ai' | 'routine' | 'manual'>('ai');
  
  // Manual State
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [routines, setRoutines] = useState<any[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && activeTab === 'routine') {
      const fetchRoutines = async () => {
        setLoadingRoutines(true);
        try {
          const res = await fetch(`${API_URL}/api/routines`, {
            headers: { Authorization: `Bearer ${user?.token}` }
          });
          const data = await res.json();
          if (res.ok) setRoutines(data);
        } catch (error) {
          console.error("Error fetching routines:", error);
        } finally {
          setLoadingRoutines(false);
        }
      };
      fetchRoutines();
    }
  }, [isOpen, activeTab, user]);

  const handleAnalizeAndSave = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!aiPrompt.trim()) {
      setError('Por favor describe lo que hiciste.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    
    try {
      // Step 1: Analyze Text
      const analysisResponse = await fetch(`${API_URL}/api/activity/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ text: aiPrompt })
      });

      if (!analysisResponse.ok) throw new Error('Falló el análisis de la IA');
      
      const { analyzedData, message } = await analysisResponse.json();
      setSuccessMsg(message);

      // Step 2: Save the analyzed activity
      await saveActivity(analyzedData.name, analyzedData.duration, analyzedData.calories);

    } catch(err: any) {
      setError(err.message || 'Error al usar la IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRoutineSelect = async (routine: any) => {
    setError('');
    setIsSubmitting(true);
    try {
      setSuccessMsg(`Registrando rutina: ${routine.title}...`);
      await saveActivity(routine.title, routine.duration, routine.calories);
    } catch (err: any) {
      setError('No se pudo guardar la rutina.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoutine = async (e: React.MouseEvent, routineId: string) => {
    e.stopPropagation();
    if (deletingId) return;
    
    const confirmed = await confirm({
      title: 'Eliminar rutina',
      message: '¿Estás seguro de eliminar esta rutina? Esto no borrará tus estadísticas pasadas.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });
    if (!confirmed) return;

    setDeletingId(routineId);
    try {
      const response = await fetch(`${API_URL}/api/routines/${routineId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      if (response.ok) {
        setRoutines(prev => prev.filter(r => r._id !== routineId));
        toast.success('Rutina eliminada');
      } else {
        toast.error('No se pudo eliminar la rutina.');
      }
    } catch (err: any) {
      toast.error('Error al conectar con el servidor.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !duration || !calories) {
      setError('Por favor completa todos los campos');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await saveActivity(name, Number(duration), Number(calories));
    } catch(err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveActivity = async (payloadName: string, payloadDuration: number, payloadCalories: number) => {
    try {
      const response = await fetch(`${API_URL}/api/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          name: payloadName,
          duration: payloadDuration,
          calories: payloadCalories,
        }),
      });

      if (!response.ok) throw new Error('Error al registrar la actividad');

      toast.success('¡Actividad registrada con éxito!');

      // Clear all formats after 1s of success visual
      setTimeout(() => {
        setName('');
        setDuration('');
        setCalories('');
        setAiPrompt('');
        setSuccessMsg('');
        onActivityAdded();
        onClose();
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Error al guardar la actividad');
      toast.error(err.message || 'Error al guardar la actividad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60]"
          />
          
          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[60] p-4"
          >
            <div className="glass-card rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-violet-500" />
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Registrar Entrenamiento
                  </h2>
                  <button 
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl mb-6 border border-slate-700/50">
                  <button onClick={() => setActiveTab('ai')} className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ai' ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'text-slate-400 hover:text-slate-200'}`}>
                    <Bot className="w-4 h-4" /> IA
                  </button>
                  <button onClick={() => setActiveTab('routine')} className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'routine' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}>
                    <ListTodo className="w-4 h-4" /> Rutinas
                  </button>
                  <button onClick={() => setActiveTab('manual')} className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'manual' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                    <PenTool className="w-4 h-4" /> Manual
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                  </div>
                )}
                {successMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2">
                    <Activity className="w-4 h-4 mt-0.5 shrink-0" /> {successMsg}
                  </div>
                )}

                {/* AI Tab */}
                {activeTab === 'ai' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex gap-3 text-sm text-slate-300">
                      <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
                      <p>Cuéntale a la IA sobre tu entrenamiento. Analizará el texto para extraer el tipo, tiempo y calorías estimadas automáticamente.</p>
                    </div>
                    <div>
                      <textarea
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 h-28 resize-none"
                        placeholder="Ej: Hoy hice 45 minutos intensos de pesas y luego corrí por media hora."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleAnalizeAndSave}
                      disabled={isAnalyzing || !!successMsg}
                      className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 flex justify-center gap-2 items-center"
                    >
                      {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Bot className="w-5 h-5" /> Analizar y Guardar</>}
                    </button>
                  </motion.div>
                )}

                {/* Routine Tab */}
                {activeTab === 'routine' && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {loadingRoutines ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
                      </div>
                    ) : routines.length === 0 ? (
                      <p className="text-center text-slate-400 py-4 text-sm">No tienes rutinas guardadas.</p>
                    ) : (
                      routines.map((r, i) => (
                        <div key={i} onClick={() => !isSubmitting && !successMsg && handleRoutineSelect(r)} className={`p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-slate-200 group-hover:text-cyan-400">{r.title}</h4>
                             <div className="flex gap-2">
                               {r.source === 'ai' && <div className="p-1.5 bg-violet-500/10 rounded-lg"><Bot className="w-4 h-4 text-violet-400" /></div>}
                               {r.source === 'manual' && <div className="p-1.5 bg-emerald-500/10 rounded-lg"><PenTool className="w-4 h-4 text-emerald-400" /></div>}
                               {r.source === 'default' && <div className="p-1.5 bg-cyan-500/10 rounded-lg"><Sparkles className="w-4 h-4 text-cyan-400" /></div>}
                               <button 
                                 onClick={(e) => handleDeleteRoutine(e, r._id)}
                                 disabled={deletingId === r._id}
                                 className="p-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/30 transition-colors"
                                 title="Eliminar rutina"
                               >
                                 {deletingId === r._id ? <div className="w-4 h-4 border-2 border-slate-500 border-t-red-400 rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                               </button>
                             </div>
                           </div>
                           <div className="flex gap-3 text-xs text-slate-400">
                             <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.duration} min</span>
                             <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {r.calories} kcal</span>
                           </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* Manual Tab */}
                {activeTab === 'manual' && (
                  <motion.form initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de la Actividad</label>
                    <input
                      type="text"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      placeholder="Ej. Correr, Pesas, Yoga"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" /> Duración
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-12"
                          placeholder="30"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">min</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                        <Flame className="w-4 h-4 text-slate-400" /> Calorías
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-12"
                          placeholder="250"
                          value={calories}
                          onChange={(e) => setCalories(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">kcal</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !!successMsg}
                    className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Guardar Actividad Manual'
                    )}
                  </button>
                </motion.form>
                )}

              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
