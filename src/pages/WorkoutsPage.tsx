import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Clock, Flame, CheckCircle2, Sparkles, PenTool, Bot, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { API_URL } from '../config';
import toast from 'react-hot-toast';

const WorkoutCard = ({ workout, onQuickLog, onDelete, isLogging, isSuccess, isDeleting }: any) => {
  const getSourceIcon = () => {
    switch(workout.source) {
      case 'ai': return <Bot className="w-6 h-6 text-violet-400" />;
      case 'manual': return <PenTool className="w-6 h-6 text-emerald-400" />;
      default: return <Sparkles className="w-6 h-6 text-cyan-400" />;
    }
  };

  const getGradient = () => {
    switch(workout.source) {
      case 'ai': return 'from-violet-500 to-fuchsia-400';
      case 'manual': return 'from-emerald-400 to-teal-500';
      default: return 'from-cyan-400 to-blue-500';
    }
  }

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-6 flex flex-col justify-between group cursor-pointer overflow-hidden relative"
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getGradient()}`} />
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-slate-800 rounded-xl shadow-inner">
            {getSourceIcon()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full">{workout.level}</span>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="text-slate-500 hover:text-red-400 transition-colors bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg border border-transparent hover:border-red-500/30"
              title="Eliminar Rutina"
            >
              {isDeleting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-red-400 rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 pr-12">{workout.title}</h3>
      </div>
      
      <button 
        onClick={onQuickLog}
        disabled={isLogging || isSuccess}
        className={`absolute bottom-6 right-6 p-2 rounded-xl transition-all shadow-lg ${
          isSuccess 
            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
            : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
        }`}
        title="Completar Hoy"
      >
        {isLogging ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
      </button>

      <div className="flex gap-4 mt-6 text-sm text-slate-400">
        <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-slate-500" /> {workout.duration} min</div>
        <div className="flex items-center gap-1"><Flame className="w-4 h-4 text-slate-500" /> {workout.calories} kcal</div>
      </div>
    </motion.div>
  );
};

export const WorkoutsPage: React.FC = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [workouts, setWorkouts] = React.useState<any[]>([]);
  const [loggingId, setLoggingId] = React.useState<number | null>(null);
  const [successId, setSuccessId] = React.useState<number | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRoutines = async () => {
      try {
        const res = await fetch(`${API_URL}/api/routines`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (res.ok) setWorkouts(data);
      } catch (error) {
        console.error("Error fetching routines:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchRoutines();
  }, [user]);

  const handleQuickLog = async (e: React.MouseEvent, idx: number, workout: any) => {
    e.stopPropagation();
    if (loggingId !== null || deletingId !== null) return;
    
    setLoggingId(idx);
    try {
      const response = await fetch(`${API_URL}/api/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          name: workout.title,
          duration: workout.duration,
          calories: workout.calories,
        }),
      });

      if (response.ok) {
        setSuccessId(idx);
        toast.success(`¡${workout.title} registrado!`);
        setTimeout(() => setSuccessId(null), 2000);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar la actividad');
    } finally {
      setLoggingId(null);
    }
  };

  const handleDeleteWorkout = async (e: React.MouseEvent, idx: number, workoutId: string) => {
    e.stopPropagation();
    if (deletingId !== null) return;
    
    const confirmed = await confirm({
      title: 'Eliminar rutina',
      message: '¿Estás seguro de que quieres eliminar esta rutina de tu lista? Esto NO afectará tus estadísticas pasadas.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });
    if (!confirmed) return;

    setDeletingId(idx);
    try {
      const response = await fetch(`${API_URL}/api/routines/${workoutId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        }
      });

      if (response.ok) {
        setWorkouts(prev => prev.filter(w => w._id !== workoutId));
        toast.success('Rutina eliminada');
      }
    } catch (err) {
      console.error("Error deleting routine", err);
      toast.error('Error al eliminar la rutina');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-6">Tus Entrenamientos</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
           <div className="w-10 h-10 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
      <div className="space-y-10">
        
        {/* Recomendaciones */}
        <div>
          <h2 className="text-xl font-semibold text-slate-300 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-400" /> Recomendaciones del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.filter(w => w.source === 'default').map((workout, idx) => (
              <WorkoutCard 
                key={`def-${idx}`} 
                workout={workout} 
                onQuickLog={(e: React.MouseEvent) => handleQuickLog(e, idx, workout)} 
                onDelete={(e: React.MouseEvent) => handleDeleteWorkout(e, idx, workout._id)}
                isLogging={loggingId === idx} 
                isSuccess={successId === idx} 
                isDeleting={deletingId === idx}
              />
            ))}
          </div>
        </div>

        {/* Creados por IA */}
        {workouts.find(w => w.source === 'ai') && (
          <div>
            <h2 className="text-xl font-semibold text-slate-300 mb-4 flex items-center gap-2"><Dumbbell className="w-5 h-5 text-violet-400" /> Entrenamientos generados por IA</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.filter(w => w.source === 'ai').map((workout, idx) => (
                <WorkoutCard 
                  key={`ai-${idx}`} 
                  workout={workout} 
                  onQuickLog={(e: React.MouseEvent) => handleQuickLog(e, idx, workout)} 
                  onDelete={(e: React.MouseEvent) => handleDeleteWorkout(e, idx, workout._id)}
                  isLogging={loggingId === idx} 
                  isSuccess={successId === idx}
                  isDeleting={deletingId === idx}
                />
              ))}
            </div>
          </div>
        )}

        {/* Manuales */}
        {workouts.find(w => w.source === 'manual') && (
          <div>
            <h2 className="text-xl font-semibold text-slate-300 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-400" /> Mis Rutinas Manuales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.filter(w => w.source === 'manual').map((workout, idx) => (
                <WorkoutCard 
                  key={`man-${idx}`} 
                  workout={workout} 
                  onQuickLog={(e: React.MouseEvent) => handleQuickLog(e, idx, workout)} 
                  onDelete={(e: React.MouseEvent) => handleDeleteWorkout(e, idx, workout._id)}
                  isLogging={loggingId === idx} 
                  isSuccess={successId === idx}
                  isDeleting={deletingId === idx}
                />
              ))}
            </div>
          </div>
        )}

      </div>
      )}
    </motion.div>
  );
};
