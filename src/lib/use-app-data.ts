import { useEffect, useRef, useState } from "react";
import { fetchAppData, emptyData, DATA_EVENT, type AppData } from "./storage";
import { useAuth } from "./auth";

const CACHE_PREFIX = "mg5-appdata:";

function readCache(userId: string): AppData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + userId);
    if (!raw) return null;
    return JSON.parse(raw) as AppData;
  } catch {
    return null;
  }
}

function writeCache(userId: string, data: AppData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(data));
  } catch {}
}

export function useAppData(): AppData & { loaded: boolean } {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const lastUser = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setData(emptyData);
      setLoaded(false);
      lastUser.current = null;
      return;
    }

    // Hydrate instantly from cache to avoid default-data flash on page switch
    if (lastUser.current !== user.id) {
      const cached = readCache(user.id);
      if (cached) {
        setData(cached);
        setLoaded(true);
      } else {
        setData(emptyData);
        setLoaded(false);
      }
      lastUser.current = user.id;
    }

    const refresh = async () => {
      const d = await fetchAppData();
      if (!active) return;
      setData(d);
      setLoaded(true);
      writeCache(user.id, d);
    };
    refresh();
    window.addEventListener(DATA_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(DATA_EVENT, refresh);
    };
  }, [user]);

  return { ...data, loaded };
}
