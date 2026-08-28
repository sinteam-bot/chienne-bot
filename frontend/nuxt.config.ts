import path from 'path';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },

  // Mode Single Page Application (Statique)
  ssr: false,

  sourcemap: {
    server: false,
    client: false
  },

  app: {
    head: {
      title: 'Bot - Interface Discord',
      titleTemplate: '%s · Bot',
      htmlAttrs: {
        lang: 'fr'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: 'Interface Web Discord pour Bot' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/api/proxy/image?url=https%3A%2F%2Fcdn.discordapp.com%2Fembed%2Favatars%2F0.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=gg+sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  nitro: {
    output: {
      publicDir: path.resolve(__dirname, '../public')
    }
  },

  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/webhook': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  }
});
