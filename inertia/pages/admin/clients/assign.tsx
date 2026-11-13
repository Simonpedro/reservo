import { Head, router, usePage } from '@inertiajs/react'
import { ChevronLeft, CircleAlert, Repeat, UsersRound } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { AssignmentWizard, WizardPlan, WizardSchedule } from '#services/schedule_assignment'
import { BackButton } from '~/components/back_button'
import { Choice } from '~/components/choice'
import { Dock } from '~/components/client_layout'
import { InfoLine } from '~/components/info_line'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'
import type { PageProps } from '~/types'

type Picks = Record<number, number[]>

function picksFor(planId: number | null, current: AssignmentWizard['current']): Picks {
  if (!current || current.planId !== planId) return {}
  return Object.fromEntries(current.quotas.map((entry) => [entry.quotaId, entry.scheduleIds]))
}

function allowed(quota: WizardPlan['quotas'][number], schedule: WizardSchedule) {
  return quota.anyActivity || quota.activityIds.includes(schedule.activityId)
}

function freeText(free: number) {
  return free === 1 ? '1 lugar fijo libre' : `${free} lugares fijos libres`
}

/**
 * Assign a plan and a fixed schedule in steps: the plan, one step per quota
 * and the start date with a summary. Everything is sent in one request.
 */
export default function AssignPlanAndSchedule({
  client,
  plans,
  schedules,
  startOptions,
  current,
}: AssignmentWizard) {
  const { errors } = usePage<PageProps>().props
  const [planId, setPlanId] = useState<number | null>(current?.planId ?? null)
  const [picks, setPicks] = useState<Picks>(() => picksFor(current?.planId ?? null, current))
  const [startsOn, setStartsOn] = useState(startOptions[0]!.date)
  const [step, setStep] = useState(0)
  const [processing, setProcessing] = useState(false)

  const plan = plans.find((candidate) => candidate.id === planId) ?? null
  const quotas = plan?.quotas ?? []
  const totalSteps = quotas.length + 2
  const quota = step >= 1 && step <= quotas.length ? quotas[step - 1]! : null
  const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]))

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  function choosePlan(id: number) {
    setPlanId(id)
    setPicks(picksFor(id, current))
  }

  function toggleSchedule(quotaId: number, limit: number, scheduleId: number) {
    setPicks((previous) => {
      const chosen = previous[quotaId] ?? []
      if (chosen.includes(scheduleId)) {
        return { ...previous, [quotaId]: chosen.filter((id) => id !== scheduleId) }
      }
      const next = limit === 1 ? [scheduleId] : [...chosen, scheduleId]
      return { ...previous, [quotaId]: next.slice(0, limit) }
    })
  }

  function confirm() {
    if (!plan) return
    router.post(
      `/admin/clientes/${client.id}/asignar`,
      {
        planId: plan.id,
        startsOn,
        quotas: quotas.map((entry) => ({
          quotaId: entry.id,
          scheduleIds: picks[entry.id] ?? [],
        })),
      },
      {
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
      }
    )
  }

  let title: string
  let subtitle: string
  let body: ReactNode
  let dock: ReactNode

  if (step === 0) {
    title = 'Elegí el plan'
    subtitle = client.fullName
    body = (
      <fieldset className="mt-5 divide-y divide-border">
        <legend className="sr-only">Plan</legend>
        {plans.map((candidate) => (
          <Choice
            key={candidate.id}
            type="radio"
            name="plan"
            value={candidate.id}
            checked={candidate.id === planId}
            onChange={() => choosePlan(candidate.id)}
            title={candidate.name}
            hint={`${candidate.summary} · ${candidate.price}`}
          />
        ))}
      </fieldset>
    )
    dock = (
      <Button type="button" disabled={!plan} onClick={() => setStep(1)}>
        Siguiente
      </Button>
    )
  } else if (quota) {
    const chosen = picks[quota.id] ?? []
    const elsewhere = new Set(
      quotas.filter((entry) => entry.id !== quota.id).flatMap((entry) => picks[entry.id] ?? [])
    )
    const options = schedules.filter(
      (schedule) => allowed(quota, schedule) && !elsewhere.has(schedule.id)
    )
    const open = options.filter((schedule) => schedule.free > 0 || chosen.includes(schedule.id))
    const full = options.filter((schedule) => schedule.free <= 0 && !chosen.includes(schedule.id))
    const atLimit = quota.weeklyCount > 1 && chosen.length >= quota.weeklyCount
    const amount = quota.weeklyCount === 1 ? '1 horario' : `${quota.weeklyCount} horarios`

    title = quota.title
    subtitle = `${client.fullName} · elegí ${amount} (${chosen.length} de ${quota.weeklyCount}).`
    body = (
      <>
        {open.length > 0 ? (
          <fieldset className="mt-5 divide-y divide-border">
            <legend className="sr-only">{`Horarios para ${quota.label}`}</legend>
            {open.map((schedule) => {
              const checked = chosen.includes(schedule.id)
              return (
                <Choice
                  key={schedule.id}
                  type={quota.weeklyCount === 1 ? 'radio' : 'checkbox'}
                  name={`quota-${quota.id}`}
                  value={schedule.id}
                  checked={checked}
                  disabled={atLimit && !checked}
                  onChange={() => toggleSchedule(quota.id, quota.weeklyCount, schedule.id)}
                  title={schedule.title}
                  hint={`${schedule.center} · ${freeText(schedule.free)}`}
                />
              )
            })}
          </fieldset>
        ) : (
          <p className="mt-5 text-base leading-tight font-bold text-muted-foreground">
            No quedan horarios con lugar para este cupo.
          </p>
        )}
        {full.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Completos</h2>
            <div className="mt-2.5 grid gap-2.5">
              {full.map((schedule) => (
                <InfoLine key={schedule.id} icon={UsersRound} muted>
                  {`${schedule.title} · ${schedule.center} · Completo`}
                </InfoLine>
              ))}
            </div>
          </section>
        )}
      </>
    )
    dock = (
      <Button
        type="button"
        disabled={chosen.length !== quota.weeklyCount}
        onClick={() => setStep(step + 1)}
      >
        Siguiente
      </Button>
    )
  } else {
    const chosen = quotas.flatMap((entry) => picks[entry.id] ?? [])
    title = '¿Desde cuándo?'
    subtitle = `${client.fullName} · ${plan?.name ?? ''}`
    body = (
      <>
        {errors?.assignment && (
          <Notice icon={CircleAlert} title="No pudimos guardar el horario." className="mt-5">
            {errors.assignment}
          </Notice>
        )}
        <fieldset className="mt-5 divide-y divide-border">
          <legend className="sr-only">Fecha de inicio</legend>
          {startOptions.map((option) => (
            <Choice
              key={option.date}
              type="radio"
              name="startsOn"
              value={option.date}
              checked={option.date === startsOn}
              onChange={() => setStartsOn(option.date)}
              title={option.label}
              hint={option.hint}
            />
          ))}
        </fieldset>
        <section className="mt-6">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Resumen</h2>
          <div className="mt-2.5 grid gap-2.5">
            {chosen.map((id) => {
              const schedule = scheduleById.get(id)
              return schedule ? (
                <InfoLine key={id} icon={Repeat}>
                  {`${schedule.title} · ${schedule.center}`}
                </InfoLine>
              ) : null
            })}
          </div>
          <p className="mt-2.5 text-base leading-tight font-bold text-muted-foreground">
            Desde esa fecha el sistema la reserva sola cada semana.
          </p>
        </section>
      </>
    )
    dock = (
      <Button type="button" disabled={processing} onClick={confirm}>
        {processing ? 'Guardando…' : 'Confirmar'}
      </Button>
    )
  }

  return (
    <>
      <Head title="Asignar plan y horario" />
      <main className="mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3 pb-32">
        <div className="mb-3 flex min-h-12 items-center gap-3">
          {step === 0 ? (
            <BackButton href={`/admin/clientes/${client.id}`} />
          ) : (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              aria-label="Volver al paso anterior"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-navy shadow-[0_7px_18px_rgb(0_26_77/0.14)]"
            >
              <ChevronLeft className="size-[22px]" strokeWidth={2.4} aria-hidden="true" />
            </button>
          )}
          <span className="text-sm font-extrabold text-muted-foreground">
            {`Paso ${step + 1} de ${totalSteps}`}
          </span>
        </div>
        <h1 className="text-[32px] leading-none font-black tracking-[-0.045em]">{title}</h1>
        <p className="mt-2 text-base leading-tight font-bold text-muted-foreground">{subtitle}</p>
        {body}
      </main>
      <Dock withNav={false}>{dock}</Dock>
    </>
  )
}
