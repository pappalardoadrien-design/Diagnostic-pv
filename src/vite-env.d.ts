/// <reference types="vite/client" />
import '@cloudflare/workers-types'

declare module '*?raw' {
  const content: string;
  export default content;
}
