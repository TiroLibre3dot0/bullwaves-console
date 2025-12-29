import React, { createContext, useContext, useState } from 'react';

const DataStatusContext = createContext();

export function DataStatusProvider({ children }) {
  const [dataStatus, setDataStatus] = useState(null);
  return (
    <DataStatusContext.Provider value={{ dataStatus, setDataStatus }}>
      {children}
    </DataStatusContext.Provider>
  );
}

export function useDataStatus() {
  return useContext(DataStatusContext);
}