import './setup-env.js'

import { serve } from '@hono/node-server'

import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3010)

serve(
  {
    fetch: createApp().fetch,
    port,
  },
  (info) => {
    console.log(`VitPOS API dev server listening on http://localhost:${info.port}`)
  },
)
