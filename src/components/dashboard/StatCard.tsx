import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DivideIcon as LucideIcon, Check, X, HelpCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  statId?: string;
  title: string;
  value: string;
  subtitle: string;
  icon: typeof LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'cyan' | 'violet' | 'emerald' | 'amber';
  goal?: number;
  onGoalUpdate?: (statId: string, newGoal: number, newSubtitle: string) => void;
  helpText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  statId,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'cyan',
  goal,
  onGoalUpdate,
  helpText
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(goal?.toString() || '');
  const [showHelp, setShowHelp] = useState(false);

  const colorMap = {
    cyan: 'from-cyan-400 to-cyan-600 shadow-cyan-500/20 text-cyan-400',
    violet: 'from-violet-400 to-violet-600 shadow-violet-500/20 text-violet-400',
    emerald: 'from-emerald-400 to-emerald-600 shadow-emerald-500/20 text-emerald-400',
    amber: 'from-amber-400 to-amber-600 shadow-amber-500/20 text-amber-400',
  };

  const bgGradientMap = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20',
    violet: 'bg-violet-500/10 border-violet-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
  };

  const handleSave = () => {
    const numericGoal = Number(editValue);
    if (!isNaN(numericGoal) && numericGoal > 0 && statId && onGoalUpdate) {
      // Build a new subtitle based on the stat title
      let newSubtitle = subtitle;
      if (title === 'Calorías Activas') newSubtitle = `Objetivo diario: ${numericGoal} kcal`;
      else if (title === 'Entrenamientos Completados') newSubtitle = `Meta mensual: ${numericGoal}`;
      else if (title === 'Proteína Diaria') newSubtitle = `Objetivo: ${numericGoal} g`;
      else if (title === 'Tiempo de Sueño') newSubtitle = `Meta: ${numericGoal} h diarias`;
      
      onGoalUpdate(statId, numericGoal, newSubtitle);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setIsEditing(false); setEditValue(goal?.toString() || ''); }
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("glass-card overflow-hidden relative group p-5", bgGradientMap[color])}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className={cn("w-20 h-20", colorMap[color].split(' ').pop())} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div className={cn("p-2.5 rounded-xl bg-slate-800 border", bgGradientMap[color])}>
            <Icon className={cn("w-5 h-5", colorMap[color].split(' ').pop())} />
          </div>
          {trend && trendValue && (
            <span className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              trend === 'up' ? "bg-emerald-500/20 text-emerald-400" : 
              trend === 'down' ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400"
            )}>
              {trend === 'up' ? '↗ ' : trend === 'down' ? '↘ ' : '→ '}{trendValue}
            </span>
          )}
        </div>
        
        <h3 className="text-slate-400 text-xs font-medium mb-1 flex items-center gap-1.5">
          {title}
          {helpText && (
            <span className="relative">
              <HelpCircle 
                className="w-3.5 h-3.5 text-slate-600 hover:text-cyan-400 cursor-help transition-colors" 
                onMouseEnter={() => setShowHelp(true)}
                onMouseLeave={() => setShowHelp(false)}
                onClick={() => setShowHelp(!showHelp)}
              />
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-[11px] text-slate-300 shadow-xl z-50 leading-relaxed"
                  >
                    {helpText}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-slate-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
          )}
        </h3>
        <p className="text-2xl font-bold text-white mb-1 tracking-tight">{value}</p>
        
        {/* Editable subtitle */}
        {isEditing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
            <button onClick={handleSave} className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setIsEditing(false); setEditValue(goal?.toString() || ''); }} className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p 
            onClick={() => { if (onGoalUpdate && statId) { setEditValue(goal?.toString() || ''); setIsEditing(true); } }}
            className={cn(
              "text-xs text-slate-500",
              onGoalUpdate && statId && "cursor-pointer hover:text-cyan-400 transition-colors hover:underline underline-offset-2"
            )}
            title={onGoalUpdate && statId ? "Haz clic para editar el objetivo" : undefined}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Premium ambient glow */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
    </motion.div>
  );
};
