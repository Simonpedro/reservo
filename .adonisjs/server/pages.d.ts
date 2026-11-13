import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'access/invalid': ExtractProps<(typeof import('../../inertia/pages/access/invalid.tsx'))['default']>
    'admin/class_session': ExtractProps<(typeof import('../../inertia/pages/admin/class_session.tsx'))['default']>
    'admin/clients/assign': ExtractProps<(typeof import('../../inertia/pages/admin/clients/assign.tsx'))['default']>
    'admin/clients/index': ExtractProps<(typeof import('../../inertia/pages/admin/clients/index.tsx'))['default']>
    'admin/clients/new': ExtractProps<(typeof import('../../inertia/pages/admin/clients/new.tsx'))['default']>
    'admin/clients/show': ExtractProps<(typeof import('../../inertia/pages/admin/clients/show.tsx'))['default']>
    'admin/coming_soon': ExtractProps<(typeof import('../../inertia/pages/admin/coming_soon.tsx'))['default']>
    'admin/payments/index': ExtractProps<(typeof import('../../inertia/pages/admin/payments/index.tsx'))['default']>
    'admin/payments/receipt': ExtractProps<(typeof import('../../inertia/pages/admin/payments/receipt.tsx'))['default']>
    'admin/payments/register': ExtractProps<(typeof import('../../inertia/pages/admin/payments/register.tsx'))['default']>
    'admin/plans/form': ExtractProps<(typeof import('../../inertia/pages/admin/plans/form.tsx'))['default']>
    'admin/plans/index': ExtractProps<(typeof import('../../inertia/pages/admin/plans/index.tsx'))['default']>
    'admin/settings': ExtractProps<(typeof import('../../inertia/pages/admin/settings.tsx'))['default']>
    'admin/settings_placeholder': ExtractProps<(typeof import('../../inertia/pages/admin/settings_placeholder.tsx'))['default']>
    'admin/today': ExtractProps<(typeof import('../../inertia/pages/admin/today.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'client/choose_class': ExtractProps<(typeof import('../../inertia/pages/client/choose_class.tsx'))['default']>
    'client/class_detail': ExtractProps<(typeof import('../../inertia/pages/client/class_detail.tsx'))['default']>
    'client/my_classes': ExtractProps<(typeof import('../../inertia/pages/client/my_classes.tsx'))['default']>
    'client/payments': ExtractProps<(typeof import('../../inertia/pages/client/payments.tsx'))['default']>
    'client/plan': ExtractProps<(typeof import('../../inertia/pages/client/plan.tsx'))['default']>
    'client/profile': ExtractProps<(typeof import('../../inertia/pages/client/profile.tsx'))['default']>
    'client/session_detail': ExtractProps<(typeof import('../../inertia/pages/client/session_detail.tsx'))['default']>
    'client/upload_receipt': ExtractProps<(typeof import('../../inertia/pages/client/upload_receipt.tsx'))['default']>
    'dashboard': ExtractProps<(typeof import('../../inertia/pages/dashboard.tsx'))['default']>
    'errors/forbidden': ExtractProps<(typeof import('../../inertia/pages/errors/forbidden.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
  }
}
