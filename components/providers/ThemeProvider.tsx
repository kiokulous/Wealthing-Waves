'use client'

/**
 * ThemeProvider — stub for single dark-mode app.
 *
 * The design system uses one fixed dark theme (set via CSS variables in globals.css).
 * This provider is kept as a no-op so existing imports of `useTheme` do not break,
 * but the `toggleTheme` function does nothing — there is no light mode to switch to.
 *
 * If you ever need a light theme in the future, re-implement the toggle logic here.
 */

import React, { createContext, useContext } from 'react'

type ThemeContextType = {
    theme: 'dark'
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    toggleTheme: () => { /* intentionally empty — single dark theme */ },
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
