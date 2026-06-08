import { describe, expect, it } from 'vitest'

describe('api vercel config', () => {
  it('routes all requests to src/index.ts without invalid custom runtime', async () => {
    const config = await import('../vercel.json', {
      with: { type: 'json' },
    })

    expect(config.default).toEqual({
      $schema: 'https://openapi.vercel.sh/vercel.json',
      framework: null,
      builds: [
        {
          src: 'api/index.js',
          use: '@vercel/node',
        },
      ],
      routes: [
        {
          src: '/(.*)',
          dest: '/api/index.js',
        },
      ],
    })
  })
})
