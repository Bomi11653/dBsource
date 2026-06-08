"use client";

import type { SeriesConfigEntry } from "@/lib/series-config";
import { createContext, useContext } from "react";

const SeriesConfigContext = createContext<SeriesConfigEntry[]>([]);

export function SeriesConfigProvider({
  config,
  children,
}: {
  config: SeriesConfigEntry[];
  children: React.ReactNode;
}) {
  return (
    <SeriesConfigContext.Provider value={config}>{children}</SeriesConfigContext.Provider>
  );
}

export function useSeriesConfig(): SeriesConfigEntry[] {
  return useContext(SeriesConfigContext);
}
