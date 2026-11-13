import { Head, useForm } from '@inertiajs/react'
import { CircleAlert, File as FileIcon } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import type { FeeLine } from '#services/my_payments'
import { BackButton } from '~/components/back_button'
import { Dock } from '~/components/client_layout'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'

/**
 * Same limits the server enforces (`#validators/receipt`); checked here only
 * to answer before uploading.
 */
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

export function fileDescription(file: { type: string; size: number }) {
  const kind = file.type === 'application/pdf' ? 'PDF' : 'Foto'
  const size =
    file.size >= 1024 * 1024
      ? `${decimal.format(file.size / (1024 * 1024))} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`
  return `${kind} · ${size}`
}

/**
 * Subir comprobante (inner page): pick a photo or PDF, check it and send it.
 */
export default function UploadReceipt({ fee }: { fee: FeeLine }) {
  const input = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const form = useForm<{ receipt: File | null }>({ receipt: null })
  const file = form.data.receipt
  const error = localError ?? form.errors.receipt

  function pick() {
    input.current?.click()
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0]
    event.target.value = ''
    if (!chosen) return
    form.clearErrors()
    if (!ACCEPTED.includes(chosen.type)) {
      setLocalError('Subí una foto (JPG, PNG o WebP) o un PDF.')
      return
    }
    if (chosen.size > MAX_BYTES) {
      setLocalError('El archivo pesa más de 5 MB. Probá con una foto más liviana.')
      return
    }
    setLocalError(null)
    form.setData('receipt', chosen)
  }

  function send() {
    form.post(`/pagos/${fee.id}/comprobante`, { forceFormData: true })
  }

  return (
    <>
      <Head title="Subir comprobante" />
      <main className="mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3 pb-36">
        <div className="mb-3 flex min-h-12 items-center">
          <BackButton href="/pagos" />
        </div>
        <h1 className="text-[32px] leading-none font-black tracking-[-0.045em]">
          Subir comprobante
        </h1>
        <p className="mt-1.5 text-sm leading-[1.3] font-bold text-muted-foreground">
          {`${fee.title} · ${fee.amount}`}
        </p>

        <input
          ref={input}
          type="file"
          name="receipt"
          accept={ACCEPTED.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={choose}
        />

        {error && <Notice icon={CircleAlert} title={error} className="mt-5" />}

        {file ? (
          <>
            <div className="mt-3.5 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-20 w-16 shrink-0 place-items-center rounded-2xl bg-wash-navy"
              >
                <FileIcon className="size-7" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-base font-black">{file.name}</strong>
                <span className="mt-0.5 block text-sm font-bold text-muted-foreground">
                  {fileDescription(file)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <Button variant="link" type="button" onClick={pick} disabled={form.processing}>
                Elegir otro archivo
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-5 text-base leading-[1.35] font-bold text-muted-foreground">
            Sacale una foto al comprobante de la transferencia o subí el PDF que te dio el banco.
          </p>
        )}
        <Dock withNav={false}>
          {file ? (
            <Button type="button" onClick={send} disabled={form.processing}>
              {form.processing ? 'Enviando…' : 'Enviar comprobante'}
            </Button>
          ) : (
            <Button type="button" onClick={pick}>
              Elegir foto o PDF
            </Button>
          )}
        </Dock>
      </main>
    </>
  )
}
