import { configApp } from '@adonisjs/eslint-config'
import { react } from '@adonisjs/eslint-config/react'

export default configApp(...react, {
  rules: {
    // Pure text helpers shared by the server and the pages.
    '@adonisjs/no-backend-import-in-frontend': [
      'error',
      { allowed: ['#services/quota_text', '#services/pending_text', '#services/places_text'] },
    ],
  },
})
