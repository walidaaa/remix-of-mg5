import { useEffect, useState } from "react";
import { loadData, type AppData } from "./storage";

export function useAppData(): AppData {
  const [data, setData] = useState<AppData>(() => loadData());
  useEffect(() => {
    const refresh = () => setData(loadData());
    refresh();
    window.addEventListener("mg5-data-update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("mg5-data-update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return data;
}
