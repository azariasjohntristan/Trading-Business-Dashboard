import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiGet } from '@/lib/api';
import type { Account } from '@/types';

interface SelectedAccountContextType {
  accounts: Account[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  refreshAccounts: () => void;
}

const SelectedAccountContext = createContext<SelectedAccountContextType | null>(null);

export function SelectedAccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const refreshAccounts = useCallback(() => {
    apiGet<Account[]>('/accounts').then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const setSelectedAccountIdSafe = useCallback((id: string) => {
    setSelectedAccountId(id);
  }, []);

  return (
    <SelectedAccountContext.Provider value={{ accounts, selectedAccountId, setSelectedAccountId: setSelectedAccountIdSafe, refreshAccounts }}>
      {children}
    </SelectedAccountContext.Provider>
  );
}

export function useSelectedAccount() {
  const ctx = useContext(SelectedAccountContext);
  if (!ctx) throw new Error('useSelectedAccount must be used within SelectedAccountProvider');
  return ctx;
}
