import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell, Shield, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sections = [
    { title: "Cuenta", icon: User, items: ["Perfil", "Suscripción", "Métodos de Pago"] },
    { title: "Notificaciones", icon: Bell, items: ["Push", "Email", "Recordatorios de Entrenamiento"] },
    { title: "Privacidad y Seguridad", icon: Shield, items: ["Contraseña", "Autenticación de 2 Factores"] },
    { title: "Aplicación", icon: Smartphone, items: ["Tema", "Idioma", "Sincronización de Dispositivos"] },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Configuración</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>

      <div className="glass-card p-6 flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 p-1">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
            <User className="w-8 h-8 text-slate-300" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
          <p className="text-slate-400">{user?.email}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="glass-card p-6 border border-slate-700/50">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
              <section.icon className="w-5 h-5 text-cyan-400" />
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors group">
                  <span>{item}</span>
                  <span className="text-slate-600 group-hover:text-cyan-400 transition-colors">→</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
