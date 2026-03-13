import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Clock, Flame, Sparkles, PenTool, Bot, Trash2, ListTodo, AlertCircle, Plus, Dumbbell } from 'lucide-react';
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
  const [manualExercises, setManualExercises] = useState<any[]>([]);
  const [showManualExForm, setShowManualExForm] = useState(false);
  const [newEx, setNewEx] = useState({ name: '', sets: '', reps: '', weight: '', duration: '', notes: '' });

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewData, setPreviewData] = useState<{
    name: string;
    duration: number;
    calories: number;
    exercises: any[];
  } | null>(null);

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

  // --- AI Flow: Step 1 - Analyze ---
  const handleAnalyze = async () => {
    if (!aiPrompt.trim()) {
      setError('Por favor describe lo que hiciste.');
      return;
    }
    setIsAnalyzing(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/activity/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ text: aiPrompt })
      });
      if (!res.ok) throw new Error('Falló el análisis de la IA');
      const { analyzedData } = await res.json();
      setPreviewData(analyzedData);
    } catch (err: any) {
      setError(err.message || 'Error al usar la IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- AI Flow: Step 2 - Confirm & Save ---
  const handleConfirmAi = async () => {
    if (!previewData) return;
    setIsSubmitting(true);
    try {
      await saveActivity(previewData.name, previewData.duration, previewData.calories, previewData.exercises);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- AI Flow: Edit preview exercise ---
  const updatePreviewEx = (index: number, field: string, value: any) => {
    if (!previewData) return;
    const updated = [...previewData.exercises];
    updated[index] = { ...updated[index], [field]: value };
    setPreviewData({ ...previewData, exercises: updated });
  };

  const removePreviewEx = (index: number) => {
    if (!previewData) return;
    setPreviewData({ ...previewData, exercises: previewData.exercises.filter((_, i) => i !== index) });
  };

  // --- Routine Flow ---
  const handleRoutineSelect = async (routine: any) => {
    setError('');
    setIsSubmitting(true);
    try {
      setSuccessMsg(`Registrando rutina: ${routine.title}...`);
      await saveActivity(routine.title, routine.duration, routine.calories, routine.exercises);
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

  // --- Manual Flow ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !duration || !calories) {
      setError('Por favor completa todos los campos');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await saveActivity(name, Number(duration), Number(calories), manualExercises.length > 0 ? manualExercises : undefined);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addManualEx = () => {
    if (!newEx.name) { toast.error('Nombre requerido'); return; }
    setManualExercises([...manualExercises, {
      name: newEx.name,
      sets: newEx.sets ? Number(newEx.sets) : null,
      reps: newEx.reps ? Number(newEx.reps) : null,
      weight: newEx.weight ? Number(newEx.weight) : null,
      duration: newEx.duration ? Number(newEx.duration) : null,
      notes: newEx.notes || null
    }]);
    setNewEx({ name: '', sets: '', reps: '', weight: '', duration: '', notes: '' });
    setShowManualExForm(false);
    toast.success('Ejercicio añadido');
  };

  // --- Shared save ---
  const saveActivity = async (payloadName: string, payloadDuration: number, payloadCalories: number, payloadExercises?: any[]) => {
    const response = await fetch(`${API_URL}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
      body: JSON.stringify({ name: payloadName, duration: payloadDuration, calories: payloadCalories, exercises: payloadExercises }),
    });
    if (!response.ok) throw new Error('Error al registrar la actividad');

    toast.success('¡Actividad registrada con éxito!');
    setSuccessMsg('¡Guardado!');
    setTimeout(() => {
      setPreviewData(null);
      setName('');
      setDuration('');
      setCalories('');
      setAiPrompt('');
      setSuccessMsg('');
      setManualExercises([]);
      onActivityAdded();
      onClose();
    }, 1000);
  };

  // ===================== RENDER =====================
  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60]" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[60] p-4 max-h-[90vh] flex flex-col"
          >
            <div className="glass-card rounded-3xl overflow-hidden relative flex flex-col max-h-[85vh]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-violet-500" />

              <div className="p-6 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Registrar Entrenamiento
                  </h2>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs (hidden during AI preview) */}
                {!previewData && (
                  <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl mb-4 border border-slate-700/50 shrink-0">
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
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                    </div>
                  )}
                  {successMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 shrink-0" /> {successMsg}
                    </div>
                  )}

                  {/* ============ AI PREVIEW (Step 2) ============ */}
                  {previewData ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2">
                          <Bot className="w-5 h-5 text-violet-400" /> Revisar Análisis
                        </h3>
                        <button onClick={() => setPreviewData(null)} className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">← Volver</button>
                      </div>

                      {/* Editable summary fields */}
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase ml-1 block mb-1">Nombre</label>
                          <input type="text" value={previewData.name} onChange={(e) => setPreviewData({ ...previewData, name: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase ml-1 block mb-1">Duración (min)</label>
                            <input type="number" value={previewData.duration} onChange={(e) => setPreviewData({ ...previewData, duration: Number(e.target.value) })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase ml-1 block mb-1">Calorías</label>
                            <input type="number" value={previewData.calories} onChange={(e) => setPreviewData({ ...previewData, calories: Number(e.target.value) })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none" />
                          </div>
                        </div>
                      </div>

                      {/* Detected exercises */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                          <Dumbbell className="w-3.5 h-3.5" /> Ejercicios Detectados ({previewData.exercises.length})
                        </h4>
                        <div className="space-y-2">
                          {previewData.exercises.map((ex, idx) => (
                            <div key={idx} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/30 group">
                              <div className="flex justify-between items-start mb-2">
                                <input type="text" value={ex.name} onChange={(e) => updatePreviewEx(idx, 'name', e.target.value)} className="bg-transparent text-sm font-bold text-white focus:outline-none flex-1" />
                                <button onClick={() => removePreviewEx(idx)} className="text-slate-600 hover:text-red-400 transition-colors ml-2"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label className="text-[8px] text-slate-600 uppercase block">Series</label>
                                  <input type="number" value={ex.sets || ''} onChange={(e) => updatePreviewEx(idx, 'sets', e.target.value ? Number(e.target.value) : null)} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none" />
                                </div>
                                <div>
                                  <label className="text-[8px] text-slate-600 uppercase block">Reps</label>
                                  <input type="number" value={ex.reps || ''} onChange={(e) => updatePreviewEx(idx, 'reps', e.target.value ? Number(e.target.value) : null)} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none" />
                                </div>
                                <div>
                                  <label className="text-[8px] text-slate-600 uppercase block">Kg</label>
                                  <input type="number" value={ex.weight || ''} onChange={(e) => updatePreviewEx(idx, 'weight', e.target.value ? Number(e.target.value) : null)} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none" />
                                </div>
                                <div>
                                  <label className="text-[8px] text-slate-600 uppercase block">Min</label>
                                  <input type="number" value={ex.duration || ''} onChange={(e) => updatePreviewEx(idx, 'duration', e.target.value ? Number(e.target.value) : null)} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button onClick={handleConfirmAi} disabled={isSubmitting || !!successMsg} className="w-full py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles className="w-5 h-5" /> Confirmar y Guardar</>}
                      </button>
                    </motion.div>
                  ) : (
                    <>
                      {/* ============ AI TAB (Step 1) ============ */}
                      {activeTab === 'ai' && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex gap-3 text-sm text-slate-300">
                            <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
                            <p>Cuéntale a la IA sobre tu entrenamiento. Extraerá los ejercicios, tiempo y calorías para que los revises antes de guardar.</p>
                          </div>
                          <textarea
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 h-28 resize-none"
                            placeholder="Ej: Hoy hice 4 series de press de banca con 80kg, 3 series de curl y 10 min de cardio."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                          />
                          <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !!successMsg}
                            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 flex justify-center gap-2 items-center"
                          >
                            {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Bot className="w-5 h-5" /> Analizar con IA</>}
                          </button>
                        </motion.div>
                      )}

                      {/* ============ ROUTINE TAB ============ */}
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

                      {/* ============ MANUAL TAB ============ */}
                      {activeTab === 'manual' && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                            <input type="text" className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="Ej. Correr, Pesas, Yoga" value={name} onChange={(e) => setName(e.target.value)} />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400" /> Duración</label>
                              <div className="relative">
                                <input type="number" min="1" className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-12" placeholder="30" value={duration} onChange={(e) => setDuration(e.target.value)} />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">min</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1"><Flame className="w-4 h-4 text-slate-400" /> Calorías</label>
                              <div className="relative">
                                <input type="number" min="1" className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-12" placeholder="250" value={calories} onChange={(e) => setCalories(e.target.value)} />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">kcal</span>
                              </div>
                            </div>
                          </div>

                          {/* Exercise sub-section */}
                          <div className="pt-2 border-t border-slate-800">
                            <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase flex justify-between items-center">
                              <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> Ejercicios ({manualExercises.length})</span>
                              <button type="button" onClick={() => setShowManualExForm(!showManualExForm)} className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[10px]">
                                <Plus className="w-3 h-3" /> {showManualExForm ? 'Cancelar' : 'Añadir'}
                              </button>
                            </h4>

                            {showManualExForm && (
                              <div className="bg-slate-800/80 p-3 rounded-2xl mb-3 border border-cyan-500/20 space-y-2">
                                <input type="text" placeholder="Nombre del ejercicio" value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                                <div className="grid grid-cols-4 gap-2">
                                  <input type="number" placeholder="Series" value={newEx.sets} onChange={(e) => setNewEx({ ...newEx, sets: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] text-white focus:outline-none" />
                                  <input type="number" placeholder="Reps" value={newEx.reps} onChange={(e) => setNewEx({ ...newEx, reps: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] text-white focus:outline-none" />
                                  <input type="number" placeholder="Kg" value={newEx.weight} onChange={(e) => setNewEx({ ...newEx, weight: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] text-white focus:outline-none" />
                                  <input type="number" placeholder="Min" value={newEx.duration} onChange={(e) => setNewEx({ ...newEx, duration: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] text-white focus:outline-none" />
                                </div>
                                <button type="button" onClick={addManualEx} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1">
                                  <Plus className="w-3.5 h-3.5" /> Añadir
                                </button>
                              </div>
                            )}

                            {manualExercises.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {manualExercises.map((ex, i) => (
                                  <div key={i} className="p-2.5 bg-slate-800/30 rounded-xl border border-slate-700/50 flex justify-between items-center">
                                    <div>
                                      <p className="text-xs font-bold text-white">{ex.name}</p>
                                      <p className="text-[10px] text-slate-500">
                                        {ex.sets && `${ex.sets}s `}{ex.reps && `× ${ex.reps} `}{ex.weight && `@ ${ex.weight}kg `}{ex.duration && `${ex.duration}min`}
                                      </p>
                                    </div>
                                    <button onClick={() => setManualExercises(manualExercises.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleManualSubmit}
                            disabled={isSubmitting || !!successMsg || !name}
                            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                          >
                            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Guardar Entrenamiento'}
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
