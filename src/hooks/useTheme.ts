import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'

export function useThemeEffect() {
  const isDark = useThemeStore((s) => s.isDark)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])
}
