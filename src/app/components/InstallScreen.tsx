'use client'

import { useState, useEffect, useCallback } from 'react'

const RECURSOS = [
  'Funciona sem conexão com a internet',
  'Receba notificações push',
  'Experiência nativa com janela própria',
]

export default function InstallScreen() {
  const [show, setShow] = useState(false)
  const [animate, setAnimate] = useState(false)
  const [prompt, setPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    if (isStandalone) return
    if (sessionStorage.getItem('pwa-install-seen')) return

    const ua = navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream
    setIsIOS(ios)

    const reveal = () => {
      setShow(true)
      // double RAF garante que o DOM está pintado antes de iniciar a transição
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    }

    if (ios) {
      const t = setTimeout(reveal, 500)
      return () => clearTimeout(t)
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      reveal()
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const close = useCallback((reason: 'install' | 'dismiss') => {
    setAnimate(false)
    sessionStorage.setItem('pwa-install-seen', reason)
    setTimeout(() => setShow(false), 300)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!prompt) return
    setBusy(true)
    try {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      close(outcome === 'accepted' ? 'install' : 'dismiss')
    } catch {
      setBusy(false)
    }
  }, [prompt, close])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-6 transition-all duration-300 ${
        animate ? 'bg-black/30 backdrop-blur-[2px]' : 'bg-transparent pointer-events-none'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) close('dismiss') }}
    >
      <div
        className={`bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-zinc-200 shadow-2xl transition-all duration-300 ${
          animate
            ? 'opacity-100 translate-y-0 sm:scale-100'
            : 'opacity-0 translate-y-10 sm:translate-y-0 sm:scale-95'
        }`}
      >
        {/* Alça mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-zinc-200" />
        </div>

        {/* Info do app */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center flex-shrink-0 shadow-md">
            <svg width="28" height="28" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="76" height="76" rx="14" fill="white" />
              <rect x="106" y="10" width="76" height="76" rx="14" fill="white" opacity="0.5" />
              <rect x="10" y="106" width="76" height="76" rx="14" fill="white" opacity="0.5" />
              <rect x="106" y="106" width="76" height="76" rx="14" fill="white" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-950 mb-0.5">Demonstração de PWA</p>
            <p className="text-xs text-zinc-400">localhost:3000</p>
          </div>
        </div>

        <div className="h-px bg-zinc-100 mx-6" />

        {/* Lista de recursos */}
        <ul className="px-6 py-4 space-y-3">
          {RECURSOS.map((r) => (
            <li key={r} className="flex items-start gap-3">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-zinc-950 flex items-center justify-center flex-shrink-0">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5.5L4 7.5L8 3"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-xs text-zinc-600 leading-relaxed">{r}</span>
            </li>
          ))}
        </ul>

        <div className="h-px bg-zinc-100 mx-6" />

        {/* Ações */}
        <div className="p-6 pt-4 flex flex-col gap-2">
          {isIOS ? (
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex items-start gap-3">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400 mt-0.5 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Toque em <strong className="font-semibold text-zinc-950">Compartilhar</strong> no Safari e depois em{' '}
                <strong className="font-semibold text-zinc-950">Adicionar à Tela de Início</strong>.
              </p>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              disabled={busy || !prompt}
              className="w-full py-2.5 rounded-xl bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {busy ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              {busy ? 'Instalando…' : 'Instalar App'}
            </button>
          )}

          <button
            onClick={() => close('dismiss')}
            className="w-full py-2.5 rounded-xl text-zinc-500 text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            Continuar no navegador
          </button>
        </div>
      </div>
    </div>
  )
}
