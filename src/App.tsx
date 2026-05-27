import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const Landing = lazy(() => import('./pages/Landing'))
const Routing = lazy(() => import('./pages/Routing'))
const Settlement = lazy(() => import('./pages/Settlement'))
const Fraud = lazy(() => import('./pages/Fraud'))
const CrossBorder = lazy(() => import('./pages/CrossBorder'))
const WalletOps = lazy(() => import('./pages/WalletOps'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
        Loading simulator
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/routing" element={<Routing />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/fraud" element={<Fraud />} />
          <Route path="/cross-border" element={<CrossBorder />} />
          <Route path="/wallet-ops" element={<WalletOps />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
