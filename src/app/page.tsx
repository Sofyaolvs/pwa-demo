'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import InstallScreen from '@/app/components/InstallScreen'

// ─── Types ────────────────────────────────────────────────────────────────────

type LogType = 'info' | 'success' | 'warn' | 'error'
interface LogEntry { id: number; ts: string; msg: string; type: LogType }
type SwStatus = 'init' | 'active' | 'error' | 'unsupported' | 'file-protocol'
type SyncStatus = 'ready' | 'pending' | 'done' | 'unsupported'

// ─── Icons ────────────────────────────────────────────────────────────────────

const WifiOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
)

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const DatabaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
)

const SyncIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <polyline points="23 20 23 14 17 14" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
  </svg>
)

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const AppLogo = () => (
  <svg width="20" height="20" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" rx="40" fill="currentColor" />
    <rect x="44" y="44" width="44" height="44" rx="8" fill="white" />
    <rect x="104" y="44" width="44" height="44" rx="8" fill="white" opacity="0.55" />
    <rect x="44" y="104" width="44" height="44" rx="8" fill="white" opacity="0.55" />
    <rect x="104" y="104" width="44" height="44" rx="8" fill="white" />
  </svg>
)

// ─── Components ───────────────────────────────────────────────────────────────

function Dot({ color, pulse = false }: { color: 'green' | 'amber' | 'red' | 'blue'; pulse?: boolean }) {
  const cls = { green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-blue-500' }
  return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${cls[color]} ${pulse ? 'animate-pulse' : ''}`} />
}

function CardIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-600 mb-4 flex-shrink-0">
      {children}
    </div>
  )
}

interface CardProps {
  icon: React.ReactNode
  title: string
  desc: string
  statusEl: React.ReactNode
  actions: React.ReactNode
}

function Card({ icon, title, desc, statusEl, actions }: CardProps) {
  return (
    <article className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col transition-all duration-200 hover:border-zinc-300 hover:shadow-sm">
      <CardIcon>{icon}</CardIcon>
      <h2 className="text-sm font-semibold text-zinc-950 mb-2">{title}</h2>
      <p className="text-xs text-zinc-500 leading-relaxed flex-1 mb-4">{desc}</p>
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-4">{statusEl}</div>
      <div className="flex gap-2">{actions}</div>
    </article>
  )
}

function BtnPrimary({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}

function BtnOutline({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-medium px-3.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [swStatus, setSwStatus] = useState<SwStatus>('init')
  const [online, setOnline] = useState(true)
  const [notifPerm, setNotifPerm] = useState<string>('default')
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [cacheInfo, setCacheInfo] = useState({ stores: 0, resources: 0, ready: false })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('ready')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [manifestOpen, setManifestOpen] = useState(false)
  const [manifestData, setManifestData] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const swRef = useRef<ServiceWorkerRegistration | null>(null)
  const idRef = useRef(0)

  const log = useCallback((msg: string, type: LogType = 'info') => {
    const ts = new Date().toLocaleTimeString('pt-BR', { hour12: false })
    setLogs((prev) => [...prev.slice(-49), { id: ++idRef.current, ts, msg, type }])
  }, [])

  const refreshCache = useCallback(async () => {
    if (!('caches' in window)) return
    try {
      const keys = await caches.keys()
      let total = 0
      for (const k of keys) {
        const c = await caches.open(k)
        total += (await c.keys()).length
      }
      setCacheInfo({ stores: keys.length, resources: total, ready: true })
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setOnline(navigator.onLine)
    if ('Notification' in window) setNotifPerm(Notification.permission)
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true)

    if (location.protocol === 'file:') {
      setSwStatus('file-protocol')
      log('Abra via servidor HTTP para funcionalidade completa', 'warn')
      return
    }

    if (!('serviceWorker' in navigator)) {
      setSwStatus('unsupported')
      log('Service Workers não suportados neste navegador', 'error')
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        swRef.current = reg
        setSwStatus('active')
        log('Service Worker registrado e ativo', 'success')
        refreshCache()
      })
      .catch((err) => {
        setSwStatus('error')
        log(`Erro no Service Worker: ${err.message}`, 'error')
      })

    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'SYNC_DONE') {
        setSyncStatus('done')
        log('Background sync concluído com sucesso', 'success')
        setTimeout(() => setSyncStatus('ready'), 3000)
      }
    })

    const onOnline = () => { setOnline(true); log('Conexão restaurada', 'success') }
    const onOffline = () => { setOnline(false); log('Offline — servindo do cache', 'warn') }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    const onInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      log('Prompt de instalação disponível', 'success')
    }
    window.addEventListener('beforeinstallprompt', onInstall)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      log('App instalado com sucesso', 'success')
    })

    log('PWA Demo inicializado', 'info')

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('beforeinstallprompt', onInstall)
    }
  }, [log, refreshCache])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const handleNotification = async () => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      const n = new Notification('PWA Demo', {
        body: 'Notificações funcionam mesmo com o app em segundo plano.',
        icon: '/icon.svg',
        tag: 'pwa-demo',
        renotify: true,
      })
      n.onclick = () => { window.focus(); n.close() }
      log('Notificação demo enviada', 'success')
    } else {
      log('Solicitando permissão de notificação...', 'info')
      const p = await Notification.requestPermission()
      setNotifPerm(p)
      log(`Permissão: ${p === 'granted' ? 'concedida' : 'negada'}`, p === 'granted' ? 'success' : 'warn')
      if (p === 'granted') {
        new Notification('PWA Demo', { body: 'Notificações ativadas!', icon: '/icon.svg' })
      }
    }
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    log(`Instalação: ${outcome === 'accepted' ? 'aceita' : 'recusada'}`, outcome === 'accepted' ? 'success' : 'warn')
    if (outcome === 'accepted') setInstallPrompt(null)
  }

  const handleClearCache = async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      setCacheInfo({ stores: 0, resources: 0, ready: true })
      log('Cache limpo', 'warn')
      setTimeout(refreshCache, 2000)
    } catch (e: any) {
      log(`Erro no cache: ${e.message}`, 'error')
    }
  }

  const handleSync = async () => {
    const reg = swRef.current
    if (!reg) { log('Service Worker não está pronto', 'warn'); return }
    if (!('sync' in reg)) {
      setSyncStatus('unsupported')
      log('Background Sync não suportado neste navegador', 'warn')
      return
    }
    try {
      await (reg as any).sync.register('demo-sync')
      setSyncStatus('pending')
      log('Background sync registrado — executando...', 'info')
    } catch (e: any) {
      log(`Erro no sync: ${e.message}`, 'error')
    }
  }

  const handleTestOffline = async () => {
    if (!('caches' in window)) { log('Cache API indisponível', 'error'); return }
    const cached = await caches.match(window.location.href)
    log(
      cached ? 'Página em cache — carrega offline ✓' : 'DevTools → Rede → Offline, depois recarregue a página',
      cached ? 'success' : 'info'
    )
    await refreshCache()
  }

  const handleShowManifest = async () => {
    try {
      const res = await fetch('/manifest.json')
      const data = await res.json()
      setManifestData(JSON.stringify(data, null, 2))
    } catch {
      setManifestData('Não foi possível carregar o manifest.json')
    }
    setManifestOpen(true)
  }

  const swLabel: Record<SwStatus, string> = {
    init: 'Iniciando',
    active: 'SW Ativo',
    error: 'Erro no SW',
    unsupported: 'Não Suportado',
    'file-protocol': 'Precisa de Servidor',
  }

  const logColors: Record<LogType, string> = {
    info: 'text-zinc-500',
    success: 'text-green-600',
    warn: 'text-amber-600',
    error: 'text-red-600',
  }

  return (
    <>
      <InstallScreen />
      {/* ── Nav ── */}
      <nav className="border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-zinc-950">
            <AppLogo />
            <span className="text-sm font-semibold">PWA Demo</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
            online ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
            {online ? 'Online' : 'Offline'}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-950 text-white">
              {swLabel[swStatus]}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-zinc-200 text-zinc-400">
              v1.0.0
            </span>
          </div>
          <h1 className="text-[2.5rem] font-semibold text-zinc-950 tracking-tight leading-[1.15] mb-4">
            Progressive Web App<br />Demonstração de Recursos
          </h1>
          <p className="text-base text-zinc-500 max-w-md leading-relaxed">
            Uma demonstração interativa dos principais recursos de PWA — construída com padrões web, sem bibliotecas externas.
          </p>
        </div>
      </header>

      {/* ── Grid ── */}
      <main className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-12">

          <Card
            icon={<WifiOffIcon />}
            title="Modo Offline"
            desc="Service Workers interceptam requisições de rede e servem recursos do cache, mantendo o app funcional mesmo sem conexão com a internet."
            statusEl={<>
              <Dot color={swStatus === 'active' ? 'green' : 'amber'} />
              {swStatus === 'active' ? 'Cache ativo' : 'Aguardando Service Worker'}
            </>}
            actions={<BtnOutline onClick={handleTestOffline}>Testar Offline</BtnOutline>}
          />

          <Card
            icon={<BellIcon />}
            title="Notificações"
            desc="O Web Push permite que o app entregue notificações diretamente ao usuário, mesmo com a aba em segundo plano — com consentimento total."
            statusEl={<>
              <Dot color={notifPerm === 'granted' ? 'green' : notifPerm === 'denied' ? 'red' : 'amber'} />
              {notifPerm === 'granted' ? 'Permissão concedida' : notifPerm === 'denied' ? 'Permissão negada' : 'Não concedida'}
            </>}
            actions={
              <BtnPrimary onClick={handleNotification} disabled={notifPerm === 'denied'}>
                {notifPerm === 'granted' ? 'Enviar Demo' : 'Ativar'}
              </BtnPrimary>
            }
          />

          <Card
            icon={<DownloadIcon />}
            title="Instalar App"
            desc="PWAs podem ser instaladas na tela inicial ou desktop, oferecendo uma experiência nativa com janela independente e ícone personalizado."
            statusEl={<>
              <Dot color={isInstalled ? 'green' : installPrompt ? 'green' : 'amber'} />
              {isInstalled ? 'Rodando como app instalado' : installPrompt ? 'Pronto para instalar' : 'Aguardando prompt'}
            </>}
            actions={
              <BtnPrimary onClick={handleInstall} disabled={!installPrompt || isInstalled}>
                {isInstalled ? 'Instalado' : 'Instalar'}
              </BtnPrimary>
            }
          />

          <Card
            icon={<DatabaseIcon />}
            title="Cache Storage"
            desc="A Cache API armazena respostas de rede localmente para recuperação instantânea. Recursos ficam disponíveis em visitas repetidas e offline."
            statusEl={<>
              <Dot color={!cacheInfo.ready ? 'amber' : cacheInfo.resources > 0 ? 'green' : 'amber'} />
              {!cacheInfo.ready
                ? 'Verificando...'
                : cacheInfo.resources > 0
                ? `${cacheInfo.resources} recurso${cacheInfo.resources !== 1 ? 's' : ''} em ${cacheInfo.stores} store${cacheInfo.stores !== 1 ? 's' : ''}`
                : 'Cache vazio'}
            </>}
            actions={<>
              <BtnOutline onClick={handleClearCache}>Limpar</BtnOutline>
              <BtnOutline onClick={refreshCache}>Atualizar</BtnOutline>
            </>}
          />

          <Card
            icon={<SyncIcon />}
            title="Background Sync"
            desc="Enfileira operações feitas offline e as re-executa automaticamente quando a conexão é restaurada, sem nenhuma intervenção do usuário."
            statusEl={<>
              <Dot
                color={syncStatus === 'done' ? 'green' : syncStatus === 'pending' ? 'blue' : syncStatus === 'unsupported' ? 'red' : 'green'}
                pulse={syncStatus === 'pending'}
              />
              {syncStatus === 'ready' && 'Pronto'}
              {syncStatus === 'pending' && 'Aguardando conexão...'}
              {syncStatus === 'done' && 'Sincronizado'}
              {syncStatus === 'unsupported' && 'Não suportado neste navegador'}
            </>}
            actions={
              <BtnOutline onClick={handleSync} disabled={syncStatus === 'pending'}>
                Disparar Sync
              </BtnOutline>
            }
          />

          <Card
            icon={<FileIcon />}
            title="Web Manifest"
            desc="O Web App Manifest é um arquivo JSON com metadados da aplicação — habilitando a instalação e controlando o comportamento de exibição."
            statusEl={<>
              <Dot color="green" />
              manifest.json carregado
            </>}
            actions={<BtnOutline onClick={handleShowManifest}>Ver Detalhes</BtnOutline>}
          />

        </div>

        {/* ── Log de Eventos ── */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Log de Eventos</span>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Limpar
            </button>
          </div>
          <div
            ref={logRef}
            className="bg-white border border-zinc-200 rounded-xl p-4 h-40 overflow-y-auto flex flex-col gap-1"
          >
            {logs.length === 0 ? (
              <span className="text-xs text-zinc-400 font-mono">Nenhum evento ainda.</span>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="flex gap-3 font-mono text-[11px]">
                  <span className="text-zinc-400 flex-shrink-0 tabular-nums">{l.ts}</span>
                  <span className={logColors[l.type]}>{l.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ── Modal Manifest ── */}
      {manifestOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setManifestOpen(false) }}
        >
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <span className="text-sm font-semibold text-zinc-950">manifest.json</span>
              <button
                onClick={() => setManifestOpen(false)}
                className="w-7 h-7 flex items-center justify-center border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <pre className="p-5 font-mono text-xs text-zinc-500 leading-relaxed overflow-y-auto whitespace-pre-wrap break-words">
              {manifestData}
            </pre>
          </div>
        </div>
      )}

      {/* ── Rodapé ── */}
      <footer className="border-t border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="text-xs text-zinc-400">Feito com Padrões Web</span>
          <span className="text-xs text-zinc-400">Next.js · Sem dependências externas</span>
        </div>
      </footer>
    </>
  )
}
