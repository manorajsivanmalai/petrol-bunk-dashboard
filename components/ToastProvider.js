'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  const notify = useCallback(text => {
    setMessage(text);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(''), 2600);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className={`toast ${message ? 'show' : ''}`}>{message}</div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
