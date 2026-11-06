import { createContext, useContext, useState, type ReactNode } from 'react';

type Intel = { sizeCode: string | null; spyTemplateId: number | null; memeSlug: string | null };
const Ctx = createContext<{ intel: Intel; setIntel: (i: Partial<Intel>) => void } | null>(null);

export function IntelProvider({ children }: { children: ReactNode }) {
  const [intel, set] = useState<Intel>({ sizeCode: null, spyTemplateId: null, memeSlug: null });
  return <Ctx.Provider value={{ intel, setIntel: (i) => set((p) => ({ ...p, ...i })) }}>{children}</Ctx.Provider>;
}
export const useIntel = () => useContext(Ctx)!;
