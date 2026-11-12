import { type Data } from '@generated/data'
import { type PropsWithChildren } from 'react'
import { type JSONDataTypes } from '@adonisjs/core/types/transformers'

export type InertiaProps<T extends JSONDataTypes = {}> = PropsWithChildren<Data.SharedProps & T>

export type UserRole = 'admin' | 'instructor' | 'client'

export type TenantProps = {
  name: string
  slug: string
  theme: {
    brandBackground?: string
    green?: string
    lightBlue?: string
    blue?: string
    accent?: string
    logoUrl?: string
  }
  themeCss: string
}

export type SharedProps = Record<string, unknown> & {
  tenant: TenantProps | null
  auth: {
    user: {
      id: number
      email: string
      fullName: string
      role: UserRole
    } | null
  }
  errors?: Record<string, string>
}

export type PageProps<T extends Record<string, unknown> = Record<string, never>> = SharedProps & T

/**
 * Bridge the shared props and flash data inferred from the Inertia
 * middleware into the Inertia client, so `usePage().props`, `usePage().flash`,
 * and layout callbacks are typed globally without passing a generic at each
 * call site.
 */
declare module '@inertiajs/core' {
  interface InertiaConfig {
    sharedPageProps: Data.SharedProps
    flashDataType: Data.FlashMessages
  }
}
