import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: { message: '' },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, options, resolve });
    });
  }, []);

  const handleResponse = (value: boolean) => {
    state.resolve?.(value);
    setState({ isOpen: false, options: { message: '' }, resolve: null });
  };

  const getVariantStyles = () => {
    switch (state.options.variant) {
      case 'danger':
        return {
          icon: 'text-red-400',
          iconBg: 'bg-red-500/10 border-red-500/20',
          confirmBtn: 'from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20',
        };
      case 'warning':
        return {
          icon: 'text-amber-400',
          iconBg: 'bg-amber-500/10 border-amber-500/20',
          confirmBtn: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20',
        };
      default:
        return {
          icon: 'text-cyan-400',
          iconBg: 'bg-cyan-500/10 border-cyan-500/20',
          confirmBtn: 'from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 shadow-cyan-500/20',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state.isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleResponse(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
            />
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[101] p-4"
            >
              <div className="glass-card rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-violet-500" />
                <div className="p-6">
                  {/* Close button */}
                  <button
                    onClick={() => handleResponse(false)}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${styles.iconBg} border flex items-center justify-center mb-4`}>
                    <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2">
                    {state.options.title || 'Confirmar acción'}
                  </h3>

                  {/* Message */}
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {state.options.message}
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResponse(false)}
                      className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-700 transition-colors text-sm"
                    >
                      {state.options.cancelText || 'Cancelar'}
                    </button>
                    <button
                      onClick={() => handleResponse(true)}
                      className={`flex-1 py-2.5 px-4 bg-gradient-to-r ${styles.confirmBtn} text-white font-semibold rounded-xl shadow-lg transition-all text-sm`}
                    >
                      {state.options.confirmText || 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
