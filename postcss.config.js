import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve the Tailwind config relative to THIS file so it works regardless of
// the process working directory (e.g. when launched by an external preview host).
const dir = path.dirname(fileURLToPath(import.meta.url))

export default {
  plugins: {
    tailwindcss: { config: path.join(dir, 'tailwind.config.js') },
    autoprefixer: {},
  },
}
