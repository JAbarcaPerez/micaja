import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/db/database'
import { hashPassword, verifyPassword, validateEmail, validatePassword, generateSalt } from '@/lib/auth'
import { nowISO } from '@/lib/utils'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  isGuest: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (name: string, email: string, password: string) => Promise<string | null>
  logout: () => void
  continueAsGuest: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isGuest: false,
      isInitialized: false,

      initialize: async () => {
        set({ isInitialized: true })
      },

      login: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase()
        const user = await db.users.where('email').equals(normalizedEmail).first()

        if (!user) return 'Correo o contraseña incorrectos'

        const valid = await verifyPassword(password, user.salt, user.passwordHash)
        if (!valid) return 'Correo o contraseña incorrectos'

        await db.users.update(user.id!, { lastLoginAt: nowISO() })

        set({
          user: { id: user.id!, name: user.name, email: user.email },
          isGuest: false,
        })
        return null
      },

      register: async (name, email, password) => {
        const normalizedEmail = email.trim().toLowerCase()

        if (!name.trim()) return 'El nombre es obligatorio'
        if (!validateEmail(normalizedEmail)) return 'Correo electrónico inválido'

        const passwordError = validatePassword(password)
        if (passwordError) return passwordError

        const existing = await db.users.where('email').equals(normalizedEmail).first()
        if (existing) return 'Este correo ya está registrado'

        const salt = generateSalt()
        const passwordHash = await hashPassword(password, salt)

        const id = await db.users.add({
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          salt,
          createdAt: nowISO(),
          lastLoginAt: nowISO(),
        })

        set({
          user: { id: id as number, name: name.trim(), email: normalizedEmail },
          isGuest: false,
        })
        return null
      },

      logout: () => {
        set({ user: null, isGuest: false })
      },

      continueAsGuest: () => {
        set({ user: null, isGuest: true })
      },
    }),
    {
      name: 'micaja-auth',
      partialize: (state) => ({
        user: state.user,
        isGuest: state.isGuest,
      }),
    }
  )
)

export async function hasRegisteredUsers(): Promise<boolean> {
  const count = await db.users.count()
  return count > 0
}
