import { createContext, useContext } from 'react'
import { FishjamProvider as FishjamContextProvider } from '@fishjam-cloud/react-client'

interface Props {
  children: React.ReactNode
}

interface FishjamContextValue {
  isEnabled: boolean
}

const FishjamEnabledContext = createContext<FishjamContextValue>({ isEnabled: false })

export function useFishjamEnabled() {
  return useContext(FishjamEnabledContext)
}

const FISHJAM_ID = import.meta.env.VITE_FISHJAM_ID || ''

export function FishjamProvider({ children }: Props) {
  if (!FISHJAM_ID) {
    console.warn('VITE_FISHJAM_ID not set, Fishjam features will be disabled')
    return (
      <FishjamEnabledContext.Provider value={{ isEnabled: false }}>
        {children}
      </FishjamEnabledContext.Provider>
    )
  }

  return (
    <FishjamEnabledContext.Provider value={{ isEnabled: true }}>
      <FishjamContextProvider fishjamId={FISHJAM_ID}>{children}</FishjamContextProvider>
    </FishjamEnabledContext.Provider>
  )
}
