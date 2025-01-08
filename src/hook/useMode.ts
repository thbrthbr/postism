import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'wood' | undefined

export const useMode = (): [Theme, () => void] => {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const localTheme = window.localStorage.getItem('theme') as Theme | null

    if (localTheme) {
      setTheme(localTheme)
      document.body.dataset.theme = localTheme
    } else {
      setTheme('light')
      document.body.dataset.theme = 'light'
    }
  }, [])

  const selectMode = (mode: string | undefined) => {
    console.log(mode)
    if (mode === 'light') return 'dark'
    if (mode === 'dark') return 'wood'
    if (mode === 'wood') return 'light'
  }

  const toggleTheme = () => {
    const newTheme = selectMode(theme)
    setTheme(newTheme)
    window.localStorage.setItem('theme', newTheme as string)
    document.body.dataset.theme = newTheme
  }

  return [theme, toggleTheme]
}
