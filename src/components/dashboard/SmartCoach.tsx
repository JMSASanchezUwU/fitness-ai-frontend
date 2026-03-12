import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from '../../config';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, TrendingUp, Utensils } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'coach' | 'user';
}

export const SmartCoach: React.FC = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `¡Buenos días, ${user?.name?.split(' ')[0] || 'Alex'}! Basado en tus datos de sueño y métricas recientes de recuperación, recomiendo cambiar tu entrenamiento a una sesión de hipertrofia. ¿En qué más te puedo ayudar?`,
      sender: 'coach'
    }
  ]);

  const suggestions = [
    { text: "Ajustar mis macros para pérdida de grasa", icon: TrendingUp },
    { text: "Recomendar una cena alta en proteínas", icon: Utensils },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || prompt;
    if (!textToSend.trim()) return;

    const newMessage: Message = { id: Date.now().toString(), text: textToSend, sender: 'user' };
    setMessages(prev => [...prev, newMessage]);
    setPrompt('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/api/coach/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ message: textToSend })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { id: Date.now().toString(), text: data.reply, sender: 'coach' }]);
      }
    } catch (error) {
      console.error('Error in coach chat', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="glass-card flex flex-col h-full relative overflow-hidden">
      {/* Decorative header glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-cyan-400" />
      
      <div className="p-6 border-b border-slate-700/50 flex items-center justify-between z-10 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500 blur-md opacity-40 rounded-full animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-violet-500/50 flex items-center justify-center relative">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Coach Aura <Sparkles className="w-4 h-4 text-violet-400" />
            </h2>
            <p className="text-xs text-slate-400">Entrenador Personal IA activo</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-4 rounded-2xl ${
                  msg.sender === 'user' 
                    ? 'bg-violet-600 text-white rounded-tr-sm' 
                    : 'bg-slate-800/60 border border-slate-700/50 text-slate-200 rounded-tl-sm'
                }`}
              >
                {msg.sender === 'coach' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400">Coach Aura</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl rounded-tl-sm flex gap-2 items-center">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
        
        {messages.length === 1 && (
          <div className="flex gap-2 flex-wrap mt-auto pt-4">
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                onClick={() => handleSend(s.text)}
                className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <s.icon className="w-3 h-3 text-cyan-400" />
                {s.text}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregúntale a tu entrenador IA cualquier cosa..."
            className="w-full bg-slate-800 border-none rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:outline-none transition-shadow"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!prompt.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:opacity-50 rounded-lg text-white transition-colors shadow-lg shadow-violet-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
