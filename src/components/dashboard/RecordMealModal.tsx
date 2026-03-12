import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UtensilsCrossed, Camera, PenTool, BookmarkCheck, Flame, Beef, Wheat, Droplets, AlertCircle, Trash2, Upload, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../ui/ConfirmDialog';
import { API_URL } from '../../config';
import toast from 'react-hot-toast';

interface RecordMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealAdded: () => void;
}

export const RecordMealModal: React.FC<RecordMealModalProps> = ({ isOpen, onClose, onMealAdded }) => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'manual' | 'photo' | 'saved'>('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Manual state
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saveAsPreset, setSaveAsPreset] = useState(false);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Saved meals state
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Common state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && activeTab === 'saved') fetchSavedMeals();
  }, [isOpen, activeTab]);

  useEffect(() => {
    // Cleanup camera on close
    if (!isOpen && cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setShowCamera(false);
    }
  }, [isOpen]);

  const fetchSavedMeals = async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch(`${API_URL}/api/saved-meals`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) setSavedMeals(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingSaved(false); }
  };

  const saveMeal = async (mealData: any) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify(mealData),
      });
      if (!res.ok) throw new Error('Error al guardar la comida');
      toast.success('¡Comida registrada!');
      setSuccessMsg('¡Registrado con éxito!');
      setTimeout(() => {
        resetForm();
        onMealAdded();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) { setError('Nombre y calorías son obligatorios'); return; }
    saveMeal({ name, calories, protein, carbs, fat, source: 'manual', saveAsPreset });
  };

  // === Photo handlers ===
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result.split(',')[1]);
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      toast.error('No se pudo acceder a la cámara');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhotoPreview(dataUrl);
    setPhotoBase64(dataUrl.split(',')[1]);
    setPhotoMime('image/jpeg');
    setAnalysis(null);
    // Stop camera
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  const analyzePhoto = async () => {
    if (!photoBase64) return;
    setIsAnalyzing(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/meals/analyze-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ imageBase64: photoBase64, mimeType: photoMime }),
      });
      if (!res.ok) throw new Error('Error analizando la foto');
      const { analysis: result } = await res.json();
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al analizar la imagen');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmAnalysis = () => {
    if (!analysis) return;
    saveMeal({
      name: analysis.name,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      source: 'photo',
      saveAsPreset: true,
    });
  };

  const handleSavedMealSelect = (meal: any) => {
    if (isSubmitting) return;
    saveMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      source: 'manual',
    });
  };

  const handleDeleteSaved = async (e: React.MouseEvent, mealId: string) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Eliminar plato guardado',
      message: '¿Quieres eliminar este plato de tus favoritos?',
      confirmText: 'Sí, eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    setDeletingId(mealId);
    try {
      const res = await fetch(`${API_URL}/api/saved-meals/${mealId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (res.ok) {
        setSavedMeals(prev => prev.filter(m => m._id !== mealId));
        toast.success('Plato eliminado');
      }
    } catch (err) { toast.error('Error al eliminar'); }
    finally { setDeletingId(null); }
  };

  const resetForm = () => {
    setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
    setSaveAsPreset(false);
    setPhotoPreview(null); setPhotoBase64(null); setAnalysis(null);
    setError(''); setSuccessMsg('');
  };

  const tabs = [
    { id: 'manual' as const, label: 'Manual', icon: PenTool },
    { id: 'photo' as const, label: 'Foto IA', icon: Camera },
    { id: 'saved' as const, label: 'Mis Platos', icon: BookmarkCheck },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60]" />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[60] p-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="glass-card rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-6 h-6 text-amber-400" /> Registrar Comida
                  </h2>
                  <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setError(''); }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Messages */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                  </div>
                )}
                {successMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" /> {successMsg}
                  </div>
                )}

                {/* Manual Tab */}
                {activeTab === 'manual' && (
                  <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleManualSubmit} className="space-y-3">
                    <input type="text" placeholder="Nombre del plato" value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1"><Flame className="w-3 h-3" /> Calorías</label>
                        <input type="number" placeholder="kcal" value={calories} onChange={e => setCalories(e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1"><Beef className="w-3 h-3" /> Proteína (g)</label>
                        <input type="number" placeholder="g" value={protein} onChange={e => setProtein(e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1"><Wheat className="w-3 h-3" /> Carbos (g)</label>
                        <input type="number" placeholder="g" value={carbs} onChange={e => setCarbs(e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1"><Droplets className="w-3 h-3" /> Grasa (g)</label>
                        <input type="number" placeholder="g" value={fat} onChange={e => setFat(e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
                      <input type="checkbox" checked={saveAsPreset} onChange={e => setSaveAsPreset(e.target.checked)} className="rounded bg-slate-800 border-slate-600 text-amber-500 focus:ring-amber-500/50" />
                      Guardar como plato favorito
                    </label>
                    <button type="submit" disabled={isSubmitting || !!successMsg}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 text-sm">
                      {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Guardar Comida'}
                    </button>
                  </motion.form>
                )}

                {/* Photo IA Tab */}
                {activeTab === 'photo' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-sm text-slate-300">
                      <Camera className="w-5 h-5 text-amber-400 shrink-0" />
                      <p>Sube una foto o toma una con la cámara. La IA identificará los alimentos y estimará los macros.</p>
                    </div>

                    {/* Camera or upload */}
                    {showCamera ? (
                      <div className="relative rounded-xl overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline className="w-full max-h-52 object-cover rounded-xl" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
                          <button onClick={capturePhoto} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center gap-2">
                            <Camera className="w-4 h-4" /> Capturar
                          </button>
                          <button onClick={() => { cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); setShowCamera(false); }} className="px-4 py-2.5 bg-slate-800/80 text-slate-300 rounded-xl text-sm">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : photoPreview ? (
                      <div className="relative">
                        <img src={photoPreview} alt="Food" className="w-full rounded-xl border border-slate-700/50 max-h-48 object-cover" />
                        <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null); setAnalysis(null); }} className="absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-8 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center gap-2 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all">
                          <Upload className="w-8 h-8" />
                          <span className="text-sm font-medium">Subir foto</span>
                        </button>
                        <button onClick={startCamera} className="flex-1 py-8 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center gap-2 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all">
                          <Camera className="w-8 h-8" />
                          <span className="text-sm font-medium">Tomar foto</span>
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </div>
                    )}

                    {/* Analyze button */}
                    {photoPreview && !analysis && (
                      <button onClick={analyzePhoto} disabled={isAnalyzing}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 text-sm flex justify-center items-center gap-2">
                        {isAnalyzing ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizando...</> : <><Camera className="w-5 h-5" /> Analizar con IA</>}
                      </button>
                    )}

                    {/* Analysis result */}
                    {analysis && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="p-4 rounded-xl bg-slate-800/60 border border-amber-500/20">
                          <input
                            type="text"
                            value={analysis.name}
                            onChange={e => setAnalysis({ ...analysis, name: e.target.value })}
                            className="w-full bg-transparent text-white font-bold mb-1 focus:outline-none focus:ring-1 focus:ring-amber-500/50 rounded-lg px-1 -mx-1 text-sm"
                          />
                          {analysis.items && (
                            <p className="text-xs text-slate-400 mb-3">Ingredientes: {analysis.items.join(', ')}</p>
                          )}
                          <p className="text-[10px] text-slate-500 mb-2 italic">Puedes editar los valores antes de guardar</p>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-slate-900/50">
                              <p className="text-xs text-slate-500 mb-1">Kcal</p>
                              <input type="number" value={analysis.calories}
                                onChange={e => setAnalysis({ ...analysis, calories: Number(e.target.value) })}
                                className="w-full bg-transparent text-sm font-bold text-amber-400 text-center focus:outline-none focus:ring-1 focus:ring-amber-500/30 rounded" />
                            </div>
                            <div className="p-2 rounded-lg bg-slate-900/50">
                              <p className="text-xs text-slate-500 mb-1">Proteína</p>
                              <input type="number" value={analysis.protein}
                                onChange={e => setAnalysis({ ...analysis, protein: Number(e.target.value) })}
                                className="w-full bg-transparent text-sm font-bold text-red-400 text-center focus:outline-none focus:ring-1 focus:ring-red-500/30 rounded" />
                            </div>
                            <div className="p-2 rounded-lg bg-slate-900/50">
                              <p className="text-xs text-slate-500 mb-1">Carbos</p>
                              <input type="number" value={analysis.carbs}
                                onChange={e => setAnalysis({ ...analysis, carbs: Number(e.target.value) })}
                                className="w-full bg-transparent text-sm font-bold text-cyan-400 text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/30 rounded" />
                            </div>
                            <div className="p-2 rounded-lg bg-slate-900/50">
                              <p className="text-xs text-slate-500 mb-1">Grasa</p>
                              <input type="number" value={analysis.fat}
                                onChange={e => setAnalysis({ ...analysis, fat: Number(e.target.value) })}
                                className="w-full bg-transparent text-sm font-bold text-emerald-400 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30 rounded" />
                            </div>
                          </div>
                          {analysis.confidence && (
                            <p className="text-[11px] text-slate-500 mt-2 text-right">Confianza IA: {analysis.confidence}</p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setAnalysis(null)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700 text-sm">
                            Reintentar
                          </button>
                          <button onClick={confirmAnalysis} disabled={isSubmitting}
                            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg text-sm disabled:opacity-50">
                            {isSubmitting ? 'Guardando...' : '✓ Confirmar y Guardar'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Saved Meals Tab */}
                {activeTab === 'saved' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {loadingSaved ? (
                      <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin" /></div>
                    ) : savedMeals.length === 0 ? (
                      <div className="text-center py-8">
                        <BookmarkCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No tienes platos guardados.</p>
                        <p className="text-slate-500 text-xs mt-1">Registra comidas y márcalas como favoritas.</p>
                      </div>
                    ) : (
                      savedMeals.map((meal: any) => (
                        <div key={meal._id} onClick={() => handleSavedMealSelect(meal)}
                          className={`p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800 hover:border-amber-500/30 transition-all cursor-pointer group ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-200 group-hover:text-amber-400 text-sm">{meal.name}</h4>
                            <button onClick={(e) => handleDeleteSaved(e, meal._id)} disabled={deletingId === meal._id}
                              className="p-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/30 transition-colors">
                              {deletingId === meal._id ? <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-red-400 rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="flex gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {meal.calories} kcal</span>
                            <span className="flex items-center gap-1"><Beef className="w-3 h-3" /> {meal.protein}g</span>
                            <span className="flex items-center gap-1"><Wheat className="w-3 h-3" /> {meal.carbs}g</span>
                            <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {meal.fat}g</span>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
