import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Activity, Flame, Dumbbell, Moon, Wheat, UtensilsCrossed } from 'lucide-react';
import { StatCard } from './StatCard';
import { SmartCoach } from './SmartCoach';
import { ProgressChart } from './ProgressChart';
import { Visualizer3D } from './Visualizer3D';
import { useAuth } from '../../context/AuthContext';
import { RecordActivityModal } from './RecordActivityModal';
import { RecordMealModal } from './RecordMealModal';
import { API_URL } from '../../config';
import toast from 'react-hot-toast';

const iconMap: Record<string, any> = {
  Flame,
  Activity,
  Dumbbell,
  Moon,
  Wheat
};

const helpTextMap: Record<string, string> = {
  'Calorías Activas': 'Se actualiza al registrar entrenamientos o comidas. Haz clic en el objetivo para personalizarlo.',
  'Entrenamientos Completados': 'Cuenta los entrenamientos registrados este mes. El objetivo se puede personalizar.',
  'Proteína Diaria': 'Se suma automáticamente al registrar comidas. Ideal: 1.6-2.2g por kg de peso.',
  'Carbohidratos': 'Se suma al registrar comidas. Ajusta según tu nivel de actividad física.',
  'Tiempo de Sueño': 'Promedio de tus horas de sueño registradas. La meta ideal es 7-9 horas.',
};

interface IStatData {
  _id: string;
  title: string;
  value: string;
  subtitle: string;
  iconName: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: 'cyan' | 'violet' | 'emerald' | 'amber';
  goal: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<IStatData[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stats`, {
          headers: {
            Authorization: `Bearer ${user?.token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setStats([]);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats([]);
      } finally {
        setLoadingStats(false);
      }
    };
    if (user?.token) {
      fetchStats();
    }
  }, [user, refreshKey]);

  const handleGoalUpdate = async (statId: string, newGoal: number, newSubtitle: string) => {
    try {
      const response = await fetch(`${API_URL}/api/stats/${statId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ goal: newGoal, subtitle: newSubtitle }),
      });
      if (response.ok) {
        const updatedStat = await response.json();
        setStats(prev => prev.map(s => s._id === statId ? updatedStat : s));
        toast.success('Objetivo actualizado');
      }
    } catch (error) {
      toast.error('Error al actualizar objetivo');
    }
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto space-y-6 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
            Bienvenido de nuevo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">{user?.name || 'Invitado'}</span>
          </h1>
          <p className="text-slate-400">Vamos a superar tus metas de fitness hoy. ¡Llevas 2 días de racha!</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsMealModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 text-amber-400 rounded-xl font-medium transition-all border border-amber-600/20 flex items-center gap-2"
          >
            <UtensilsCrossed className="w-4 h-4" /> Registrar Comida
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-700"
          >
            Registrar Entrenamiento
          </button>
        </div>
      </motion.div>

      {/* Top Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-36 flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500/50 border-t-transparent animate-spin" />
            </div>
          ))
        ) : (
          stats.map((stat) => (
            <StatCard
              key={stat._id}
              statId={stat._id}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={iconMap[stat.iconName] || Activity}
              trend={stat.trend}
              trendValue={stat.trendValue}
              color={stat.color}
              goal={stat.goal}
              onGoalUpdate={handleGoalUpdate}
              helpText={helpTextMap[stat.title]}
            />
          ))
        )}
      </motion.div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 h-[450px]">
          <ProgressChart refreshKey={refreshKey} />
        </motion.div>
        <motion.div variants={itemVariants} className="h-[450px]">
          <SmartCoach />
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="h-[400px]">
        <Visualizer3D />
      </motion.div>

      <RecordActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onActivityAdded={() => setRefreshKey(prev => prev + 1)}
      />
      <RecordMealModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        onMealAdded={() => setRefreshKey(prev => prev + 1)}
      />
    </motion.div>
  );
};
