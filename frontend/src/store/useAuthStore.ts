import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscriptionTier: string;
  energy: number;
  bio?: string;
  avatarUrl?: string;
  provider?: string;
  isVerified?: boolean;
  linkedAccounts?: { provider: string; providerId: string; linkedAt: string }[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateEnergy: (newEnergy: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),

      logout: () => set({ user: null, token: null }),

      updateEnergy: (newEnergy) => 
        set((state) => ({
          user: state.user ? { ...state.user, energy: newEnergy } : null
        })),
    }),
    {
      name: "Atlas-auth-storage",
    }
  )
);
