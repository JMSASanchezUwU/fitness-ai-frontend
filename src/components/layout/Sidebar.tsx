import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Activity, Calendar, Settings, Menu, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Inicio', icon: Home, path: '/' },
    { name: 'Entrenamientos', icon: Activity, path: '/workouts' },
    { name: 'Horario', icon: Calendar, path: '/schedule' },
    { name: 'Configuración', icon: Settings, path: '/settings' },
  ];

  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col glass border-r border-slate-700/50 bg-slate-900/80 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="flex items-center justify-between p-4 h-20 border-b border-slate-700/50">
        <div className={cn("flex items-center gap-3 overflow-hidden transition-all", !isExpanded && "w-0 opacity-0")}>
          <div className="bg-gradient-to-tr from-cyan-400 to-violet-500 rounded-xl p-2">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            AuraFit
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-3 relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              to={item.path}
              key={item.name}
              className={cn(
                "relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group overflow-hidden",
                isActive ? "text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-xl border border-cyan-500/30"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className="relative z-10 flex items-center justify-center w-6">
                <Icon className={cn("w-5 h-5 transition-colors duration-200", isActive ? "text-cyan-400" : "group-hover:text-cyan-400")} />
              </div>

              <span className={cn(
                "relative z-10 font-medium whitespace-nowrap transition-all duration-300",
                !isExpanded && "w-0 opacity-0 hidden"
              )}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-800 transition-colors group overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-slate-400 group-hover:text-violet-400 transition-colors" />
          </div>
          <div className={cn("flex flex-col items-start transition-all duration-300", !isExpanded && "hidden opacity-0")}>
            <span className="text-sm font-medium text-slate-200">{user?.name || 'Cargando...'}</span>
            <span className="text-xs text-slate-500">Miembro Pro</span>
          </div>
        </button>
      </div>
    </motion.aside>
  );
};
