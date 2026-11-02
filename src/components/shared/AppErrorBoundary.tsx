import { ErrorBoundary } from '@sentry/react'
import type { PropsWithChildren } from 'react'
import { Button } from '@/components/ui/button'

export default function AppErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <h1 className="text-2xl font-bold">Não foi possível carregar esta página</h1>
          <p className="text-sm text-muted-foreground">Tente recarregar para continuar usando o iCuide.</p>
          <Button onClick={() => window.location.reload()}>Recarregar página</Button>
        </main>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
