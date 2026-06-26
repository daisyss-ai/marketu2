'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

// Componente sem render — só dispara a hidratação da auth store
// uma vez, depois do mount no cliente, para nunca causar
// divergência entre o HTML do servidor e o do cliente.
export default function AuthHydrator() {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  return null;
}