import { useEffect, useState } from 'react';
import {
  getBootstrapRoute,
  type BootstrapRoute,
} from '@/core/session/bootstrap';
import { useSessionStore } from '@/app/state';

export function useBootstrapRoute() {
  const [route, setRoute] = useState<BootstrapRoute | null>(null);

  useEffect(() => {
    const st = useSessionStore.getState();
    if (!st.hydrated) st.hydrate();

    // теперь hydrated точно true (у тебя hydrate sync)
    setRoute(getBootstrapRoute());

    const unsub = useSessionStore.subscribe(
      s => [s.hydrated, s.status, s.accessToken] as const,
      ([hydrated]) => {
        if (!hydrated) return; // пока не hydrated — не пересчитываем
        setRoute(getBootstrapRoute());
      },
    );

    return () => unsub();
  }, []);

  return route;
}
