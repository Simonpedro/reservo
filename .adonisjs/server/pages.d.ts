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
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'client/class_detail': ExtractProps<(typeof import('../../inertia/pages/client/class_detail.tsx'))['default']>
    'client/coming_soon': ExtractProps<(typeof import('../../inertia/pages/client/coming_soon.tsx'))['default']>
    'client/my_classes': ExtractProps<(typeof import('../../inertia/pages/client/my_classes.tsx'))['default']>
    'client/profile': ExtractProps<(typeof import('../../inertia/pages/client/profile.tsx'))['default']>
    'dashboard': ExtractProps<(typeof import('../../inertia/pages/dashboard.tsx'))['default']>
    'errors/forbidden': ExtractProps<(typeof import('../../inertia/pages/errors/forbidden.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
  }
}
