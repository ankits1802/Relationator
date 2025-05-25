
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useMemo } from 'react';

export type DisplayMode = 'text' | 'numeric';
export type AttributeMap = Map<string, number> | null;

interface DisplayModeContextType {
  attributeMap: AttributeMap;
  setAttributeMap: (map: AttributeMap) => void;
}

const DisplayModeContext = createContext<DisplayModeContextType | undefined>(undefined);

export const DisplayModeProvider = ({ children }: { children: ReactNode }) => {
  const [attributeMap, setAttributeMap] = useState<AttributeMap>(null);

  const value = useMemo(() => ({
    attributeMap,
    setAttributeMap,
  }), [attributeMap]);

  return (
    <DisplayModeContext.Provider value={value}>
      {children}
    </DisplayModeContext.Provider>
  );
};

export const useDisplayMode = (): DisplayModeContextType => {
  const context = useContext(DisplayModeContext);
  if (context === undefined) {
    throw new Error('useDisplayMode must be used within a DisplayModeProvider');
  }
  return context;
};

