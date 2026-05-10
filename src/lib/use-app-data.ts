import { useEffect, useState } from "react";
import { fetchAppData, emptyData, DATA_EVENT, type AppData } from "./storage";
import { useAuth } from "./auth";

export function useAppData(): AppData {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);

  useEffect(() => {
    let active = true;
    if (!user) {
      setData(emptyData);
      return;
    }
    const refresh = async () => {
      const d = await fetchAppData();
      if (active) setData(d);
    };
    refresh();
    window.addEventListener(DATA_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(DATA_EVENT, refresh);
    };
  }, [user]);

  return data;
}
