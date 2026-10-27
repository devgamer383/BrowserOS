import type { AgentSettings } from '@browseros/claw-api'
import { JevTokenSource } from '@browseros/claw-api'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Button } from '@/components/motion/button/base'
import { Input } from '@/components/ui/input'
import {
  useAgentSettings,
  useRemoveJevToken,
  useSaveJevToken,
} from '@/modules/api/agent-settings.hooks'

const KEY_INPUT_ID = 'jev-token-input'
const KEY_TITLE_ID = 'jev-token-title'
const KEY_DESCRIPTION_ID = 'jev-token-description'

type DecisionProvider = 'typesafe' | 'cloudflare' | 'custom'

/**
 * The Decision Model & Acceleration settings.
 * Supports:
 * 1. Cloudflare Workers AI (Clef & Clef-Flash) - high-speed System-1 decision reasoning (70-120ms)
 * 2. TypeSafe Jev (Ultrafast early access)
 * 3. Custom / Self-Hosted zero-registry endpoints (vLLM, Ollama)
 */
export function UltrafastKey({ source }: { source: JevTokenSource }) {
  const { data: settings } = useAgentSettings()
  const [provider, setProvider] = useState<DecisionProvider>(() => {
    if (settings?.decisionProvider === 'cloudflare' || settings?.cloudflareAccountId) {
      return 'cloudflare'
    }
    if (settings?.decisionProvider === 'custom' || settings?.decisionEndpoint) {
      return 'custom'
    }
    return 'typesafe'
  })

  // Jev / TypeSafe field ref
  const field = useRef<HTMLInputElement>(null)
  // Cloudflare fields refs
  const cfAccountField = useRef<HTMLInputElement>(null)
  const cfTokenField = useRef<HTMLInputElement>(null)
  const [cfModel, setCfModel] = useState<'@cf/cloudflare/clef-flash' | '@cf/cloudflare/clef'>(
    (settings?.decisionModel as any) || '@cf/cloudflare/clef-flash',
  )
  // Custom fields refs
  const customEndpointField = useRef<HTMLInputElement>(null)
  const customModelField = useRef<HTMLInputElement>(null)
  const customTokenField = useRef<HTMLInputElement>(null)

  const [replacing, setReplacing] = useState(false)
  const save = useSaveJevToken()
  const remove = useRemoveJevToken()
  const queryClient = useQueryClient()

  const publish = (saved: AgentSettings) => {
    queryClient.setQueryData(useAgentSettings.getKey(), saved)
    if (field.current) field.current.value = ''
    if (cfAccountField.current) cfAccountField.current.value = ''
    if (cfTokenField.current) cfTokenField.current.value = ''
    if (customEndpointField.current) customEndpointField.current.value = ''
    if (customModelField.current) customModelField.current.value = ''
    if (customTokenField.current) customTokenField.current.value = ''
    setReplacing(false)
  }

  const saved = source === JevTokenSource.Settings
  const showField = !saved || replacing
  const busy = save.isPending || remove.isPending

  return (
    <div className="flex flex-col gap-4">
      {/* Provider Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border-2 w-fit">
        <button
          type="button"
          onClick={() => {
            setProvider('typesafe')
            setReplacing(false)
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            provider === 'typesafe'
              ? 'bg-card text-cyanotype-ink shadow-sm'
              : 'text-ink-2 hover:text-cyanotype-ink'
          }`}
        >
          TypeSafe Jev (Ultrafast)
        </button>
        <button
          type="button"
          onClick={() => {
            setProvider('cloudflare')
            setReplacing(false)
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            provider === 'cloudflare'
              ? 'bg-card text-cyanotype-ink shadow-sm'
              : 'text-ink-2 hover:text-cyanotype-ink'
          }`}
        >
          Cloudflare Clef (Recommended)
        </button>
        <button
          type="button"
          onClick={() => {
            setProvider('custom')
            setReplacing(false)
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            provider === 'custom'
              ? 'bg-card text-cyanotype-ink shadow-sm'
              : 'text-ink-2 hover:text-cyanotype-ink'
          }`}
        >
          Custom / Self-Hosted
        </button>
      </div>

      {provider === 'typesafe' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span
              id={KEY_TITLE_ID}
              className="font-semibold text-[15.5px] text-cyanotype-ink"
            >
              Ultrafast access key
            </span>
            <span id={KEY_DESCRIPTION_ID} className="text-[14px] text-ink-2">
              {saved
                ? 'A key is saved, so your AI agents can use Ultrafast.'
                : source === JevTokenSource.Environment
                  ? 'BrowserOS already has a key from its own setup. A key saved here takes precedence over it.'
                  : 'Only needed if you joined the Ultrafast early access. Without a key, your AI agents don’t get Ultrafast.'}
            </span>
          </div>

          {showField ? (
            <form
              className="flex flex-wrap items-start gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                const token = field.current?.value.trim()
                if (!token) return
                save.mutate({ token, provider: 'typesafe' }, { onSuccess: publish })
              }}
            >
              <Input
                ref={field}
                id={KEY_INPUT_ID}
                type="password"
                autoComplete="off"
                spellCheck={false}
                aria-labelledby={KEY_TITLE_ID}
                aria-describedby={KEY_DESCRIPTION_ID}
                placeholder="Paste your key"
                disabled={busy}
                className="h-10 max-w-sm flex-1 rounded-xl"
              />
              <Button type="submit" disabled={busy} className="font-semibold">
                Save
              </Button>
              {saved ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (field.current) field.current.value = ''
                    setReplacing(false)
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => setReplacing(true)}
                className="font-semibold"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => remove.mutate(undefined, { onSuccess: publish })}
                className="font-semibold"
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : provider === 'cloudflare' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-[15.5px] text-cyanotype-ink">
              Cloudflare Workers AI (Clef & Clef-Flash)
            </span>
            <span className="text-[14px] text-ink-2">
              Fast System-1 reasoning models hosted natively on Cloudflare Workers AI.
              Clef-Flash runs with ultra-low latency (70–120ms) and eliminates agent token costs.
            </span>
          </div>

          <form
            className="flex flex-col gap-3 max-w-md"
            onSubmit={(event) => {
              event.preventDefault()
              const accountId = cfAccountField.current?.value.trim() || settings?.cloudflareAccountId
              const apiToken = cfTokenField.current?.value.trim()
              if (!accountId) return
              save.mutate(
                {
                  provider: 'cloudflare',
                  cloudflareAccountId: accountId,
                  cloudflareApiToken: apiToken || undefined,
                  model: cfModel,
                },
                { onSuccess: publish },
              )
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-2">Cloudflare Account ID</label>
              <Input
                ref={cfAccountField}
                type="text"
                autoComplete="off"
                spellCheck={false}
                defaultValue={settings?.cloudflareAccountId ?? ''}
                placeholder="32-hex Account ID (e.g. 023e105f4ecef8ad9ca31a8372d0c353)"
                disabled={busy}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-2">Workers AI API Token</label>
              <Input
                ref={cfTokenField}
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={settings?.hasCloudflareToken ? '•••••••••••••••• (Saved)' : 'Cloudflare API Token'}
                disabled={busy}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-2">Model</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCfModel('@cf/cloudflare/clef-flash')}
                  className={`flex-1 py-2 px-3 text-xs rounded-xl border text-left transition-colors ${
                    cfModel === '@cf/cloudflare/clef-flash'
                      ? 'border-cyanotype-ink bg-card font-semibold text-cyanotype-ink'
                      : 'border-border-2 text-ink-2 hover:bg-muted/40'
                  }`}
                >
                  <div>clef-flash (Fastest)</div>
                  <div className="text-[11px] text-ink-3">~70ms latency</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCfModel('@cf/cloudflare/clef')}
                  className={`flex-1 py-2 px-3 text-xs rounded-xl border text-left transition-colors ${
                    cfModel === '@cf/cloudflare/clef'
                      ? 'border-cyanotype-ink bg-card font-semibold text-cyanotype-ink'
                      : 'border-border-2 text-ink-2 hover:bg-muted/40'
                  }`}
                >
                  <div>clef (Full 7B)</div>
                  <div className="text-[11px] text-ink-3">~200ms latency</div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" disabled={busy} className="font-semibold">
                Save Cloudflare Clef
              </Button>
              {settings?.hasCloudflareToken ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => remove.mutate(undefined, { onSuccess: publish })}
                  className="font-semibold"
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-[15.5px] text-cyanotype-ink">
              Custom / Self-Hosted Endpoint
            </span>
            <span className="text-[14px] text-ink-2">
              Connect a self-hosted decision server or zero-registry gateway (vLLM, Ollama, SGLang).
              Executes direct decision POSTs without pre-flight model discovery.
            </span>
          </div>

          <form
            className="flex flex-col gap-3 max-w-md"
            onSubmit={(event) => {
              event.preventDefault()
              const endpoint = customEndpointField.current?.value.trim()
              const model = customModelField.current?.value.trim()
              const token = customTokenField.current?.value.trim()
              if (!endpoint) return
              save.mutate(
                {
                  provider: 'custom',
                  endpoint,
                  model: model || undefined,
                  token: token || undefined,
                },
                { onSuccess: publish },
              )
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-2">Endpoint URL</label>
              <Input
                ref={customEndpointField}
                type="text"
                autoComplete="off"
                spellCheck={false}
                defaultValue={settings?.decisionEndpoint ?? ''}
                placeholder="https://your-domain.com/v1/systemone"
                disabled={busy}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-2">Model Name</label>
              <Input
                ref={customModelField}
                type="text"
                autoComplete="off"
                spellCheck={false}
                defaultValue={settings?.decisionModel ?? ''}
                placeholder="e.g. jev-latest or custom-model"
                disabled={busy}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-2">Bearer Token (Optional)</label>
              <Input
                ref={customTokenField}
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder="Optional Bearer token"
                disabled={busy}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" disabled={busy} className="font-semibold">
                Save Custom Endpoint
              </Button>
              {settings?.decisionEndpoint ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => remove.mutate(undefined, { onSuccess: publish })}
                  className="font-semibold"
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      )}

      <p className="text-[13px] text-ink-3">
        Your AI agents pick up the configured decision model on their next action loop.
      </p>

      {save.isError || remove.isError ? (
        <p role="alert" className="text-[13.5px] text-red-ink">
          Couldn’t save that. Try again.
        </p>
      ) : null}
    </div>
  )
}
