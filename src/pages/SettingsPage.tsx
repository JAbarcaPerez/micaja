import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useThemeStore } from '@/stores/themeStore'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import { useSyncStore } from '@/stores/syncStore'
import { resetDatabase } from '@/db/seed'
import { seedDemoData } from '@/db/demoSeed'
import { exportBackup, downloadBackup, parseBackupFile, importBackup } from '@/lib/sync'
import { performCloudSync } from '@/hooks/useAutoSync'
import { formatDate } from '@/lib/format'
import {
  Moon,
  Sun,
  Database,
  Trash2,
  RefreshCw,
  Cloud,
  Upload,
  Download,
  User,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

export function SettingsPage() {
  const { isDark, setDark } = useThemeStore()
  const loadAll = useDataStore((s) => s.loadAll)
  const user = useAuthStore((s) => s.user)
  const isGuest = useAuthStore((s) => s.isGuest)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const syncConfig = useSyncStore()
  const { enabled, endpointUrl, apiToken, autoSyncIntervalMinutes, lastSyncAt, lastSyncStatus, lastSyncError, isSyncing, setConfig } =
    syncConfig

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  const handleReset = async () => {
    if (confirm('¿Estás seguro? Se eliminarán todos los datos y se restaurarán los valores por defecto.')) {
      await resetDatabase()
      await loadAll()
    }
  }

  const handleLoadDemo = async () => {
    if (!confirm('Se reemplazarán las cuentas y movimientos actuales con datos de demostración. ¿Continuar?')) return
    setDemoLoading(true)
    try {
      await seedDemoData()
      await loadAll()
    } finally {
      setDemoLoading(false)
    }
  }

  const handleExportFile = async () => {
    const payload = await exportBackup(user?.id)
    downloadBackup(payload)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const payload = await parseBackupFile(file)
      await importBackup(payload, true)
      await loadAll()
      setSyncMessage('Backup importado correctamente')
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Error al importar')
    }
    e.target.value = ''
  }

  const handleCloudSync = async (direction: 'upload' | 'download' | 'merge') => {
    setSyncMessage('')
    const error = await performCloudSync(direction)
    if (error) setSyncMessage(error)
    else setSyncMessage('Sincronización completada')
  }

  return (
    <div>
      <Header title="Configuración" description="Personaliza tu experiencia en MiCaja" />

      <div className="max-w-2xl space-y-6">
        {/* Cuenta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5" />
              Cuenta
            </CardTitle>
            <CardDescription>
              {user
                ? 'Tu sesión está activa. La sincronización en la nube requiere cuenta registrada.'
                : 'Estás en modo invitado. Crea una cuenta para sincronizar en la nube.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="success">Conectado</Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo invitado</p>
                  <p className="text-sm text-muted-foreground">Los datos solo se guardan en este dispositivo</p>
                </div>
                <Badge variant="secondary">Invitado</Badge>
              </div>
            )}
            <Separator />
            <div className="flex gap-2">
              {!user && (
                <>
                  <Button size="sm" asChild>
                    <Link to="/registro">Crear cuenta</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/login">Iniciar sesión</Link>
                  </Button>
                </>
              )}
              {(user || isGuest) && (
                <Button size="sm" variant="outline" onClick={() => { logout(); navigate('/login') }}>
                  {user ? 'Cerrar sesión' : 'Salir del modo invitado'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Apariencia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Modo oscuro</Label>
            <Switch id="dark-mode" checked={isDark} onCheckedChange={setDark} />
          </CardContent>
        </Card>

        {/* Datos demo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Datos de demostración
            </CardTitle>
            <CardDescription>
              Carga movimientos, cuentas, ahorros y préstamos de ejemplo para explorar la app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLoadDemo} disabled={demoLoading}>
              {demoLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Cargar datos de demostración
            </Button>
          </CardContent>
        </Card>

        {/* Sincronización en la nube */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Sincronización en la nube
            </CardTitle>
            <CardDescription>
              Conecta un endpoint REST propio (PUT/GET) para respaldar y restaurar tus datos entre dispositivos.
              Compatible con servicios como JSONBin, Firebase REST o tu propio backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sync-enabled">Sincronización automática</Label>
              <Switch
                id="sync-enabled"
                checked={enabled}
                onCheckedChange={(v) => setConfig({ enabled: v })}
                disabled={!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sync-url">URL del endpoint</Label>
              <Input
                id="sync-url"
                placeholder="https://api.tuservidor.com/sync/micaja"
                value={endpointUrl}
                onChange={(e) => setConfig({ endpointUrl: e.target.value })}
                disabled={!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sync-token">Token de API (Bearer)</Label>
              <Input
                id="sync-token"
                type="password"
                placeholder="tu-token-secreto"
                value={apiToken}
                onChange={(e) => setConfig({ apiToken: e.target.value })}
                disabled={!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sync-interval">Intervalo auto-sync (minutos)</Label>
              <Input
                id="sync-interval"
                type="number"
                min={1}
                max={60}
                value={autoSyncIntervalMinutes}
                onChange={(e) => setConfig({ autoSyncIntervalMinutes: Number(e.target.value) })}
                disabled={!user}
              />
            </div>

            {!user && (
              <p className="text-sm text-muted-foreground">
                Inicia sesión para habilitar la sincronización en la nube.
              </p>
            )}

            {user && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={isSyncing} onClick={() => handleCloudSync('upload')}>
                  <Upload className="h-4 w-4 mr-1" />
                  Subir
                </Button>
                <Button size="sm" variant="outline" disabled={isSyncing} onClick={() => handleCloudSync('download')}>
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </Button>
                <Button size="sm" disabled={isSyncing} onClick={() => handleCloudSync('merge')}>
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Sincronizar
                </Button>
              </div>
            )}

            {lastSyncAt && (
              <div className="flex items-center gap-2 text-sm">
                {lastSyncStatus === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-muted-foreground">
                  Última sync: {formatDate(lastSyncAt)}
                  {lastSyncError && ` — ${lastSyncError}`}
                </span>
              </div>
            )}

            {syncMessage && (
              <p className={`text-sm ${syncMessage.includes('Error') || syncMessage.includes('Configura') ? 'text-destructive' : 'text-success'}`}>
                {syncMessage}
              </p>
            )}

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Backup manual (archivo JSON)</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportFile}>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar archivo
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" />
                  Importar archivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos locales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datos locales
            </CardTitle>
            <CardDescription>
              Almacenamiento offline con IndexedDB en tu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recargar datos</p>
                <p className="text-sm text-muted-foreground">Sincroniza el estado con la base de datos local</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadAll}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Recargar
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Restablecer datos</p>
                <p className="text-sm text-muted-foreground">Elimina movimientos y restaura valores por defecto</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleReset}>
                <Trash2 className="h-4 w-4 mr-1" />
                Restablecer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acerca de MiCaja</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Versión:</strong> 1.1.0</p>
            <p><strong>Novedades:</strong> Autenticación, sincronización en la nube y datos de demostración</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
