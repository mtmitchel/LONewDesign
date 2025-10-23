"use client";

import React, { createContext, useContext } from 'react';

interface TaskCardContextType {
  // Add any shared state here if needed in the future
  // For now, this is a placeholder for potential shared state
}

const TaskCardContext = createContext<TaskCardContextType | undefined>(undefined);

export function TaskCardProvider({ children }: { children: React.ReactNode }) {
  const value: TaskCardContextType = {
    // Add shared state here if needed
  };

  return (
    <TaskCardContext.Provider value={value}>
      {children}
    </TaskCardContext.Provider>
  );
}

export function useTaskCard() {
  const context = useContext(TaskCardContext);
  if (context === undefined) {
    throw new Error('useTaskCard must be used within a TaskCardProvider');
  }
  return context;
}