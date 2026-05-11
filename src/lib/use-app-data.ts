import { useEffect, useState } from "react";
import { fetchAppData, emptyData, DATA_EVENT, type AppData } from "./storage";
import { useAuth } from "./auth";

export function useAppData(): AppData & { loaded: boolean } {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setData(emptyData);
      setLoaded(false);
      return;
    }
    setLoaded(false);
    const refresh = async () => {
      const d = await fetchAppData();
      if (active) {
        setData(d);
        setLoaded(true);
      }
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
