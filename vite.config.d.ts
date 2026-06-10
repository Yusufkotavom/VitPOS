declare module '@tailwindcss/vite' {
  const plugin: () => unknown
  export default plugin
}

declare module '@vitejs/plugin-react' {
  const plugin: () => unknown
  export default plugin
}

declare module 'vite' {
  export function defineConfig(config: unknown): unknown
}
