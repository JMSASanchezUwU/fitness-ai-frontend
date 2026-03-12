import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        login(data);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-400 to-violet-500 rounded-xl p-3">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <span className="font-bold text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
              AuraFit
            </span>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Bienvenido de nuevo</h2>
          <p className="text-slate-400 text-sm text-center mb-8">Ingresa tus credenciales para continuar</p>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  placeholder="ejemplo@correo.com"
                  required
                />
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/25 mt-4 group"
            >
              Iniciar sesión
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿No tienes cuenta? <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
