import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression2'
import { securityHeadersPlugin } from './src/shared/lib/security/vite-security-plugin'

// Performance-optimized Vite configuration
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'

  return {
    base: process.env.GITHUB_ACTIONS ? '/mydub.ai-s0/' : '/',
    
    plugins: [
      // React with SWC for faster builds
      react({
        fastRefresh: isDevelopment,
        babel: {
          plugins: [
            ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
          ],
        },
      }),

      // Security headers
      securityHeadersPlugin(),

      // Advanced compression for production
      ...(isProduction
        ? [
            compression({
              algorithm: 'gzip',
              exclude: [/\.(br)$/, /\.(gz)$/],
              threshold: 1024,
              compressionOptions: { level: 9 },
              deleteOriginalAssets: false,
            }),
            compression({
              algorithm: 'brotliCompress',
              exclude: [/\.(br)$/, /\.(gz)$/],
              threshold: 1024,
              compressionOptions: {
                params: {
                  [1]: 11, // BROTLI_PARAM_QUALITY
                },
              },
              deleteOriginalAssets: false,
            }),
          ]
        : []),

      // Bundle analyzer
      ...(isProduction && env.VITE_BUNDLE_ANALYZER === 'true'
        ? [
            visualizer({
              open: true,
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
              template: 'sunburst', // Better visualization
            }),
          ]
        : []),

      // Sentry source maps
      ...(isProduction && env.SENTRY_AUTH_TOKEN
        ? [
            sentryVitePlugin({
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              authToken: env.SENTRY_AUTH_TOKEN,
              release: {
                name: env.VITE_APP_VERSION || '1.0.0',
                uploadLegacySourcemaps: false,
                setCommits: {
                  auto: true,
                },
              },
              sourcemaps: {
                assets: './dist/**',
                ignore: ['node_modules', '**/*.spec.ts', '**/*.test.ts'],
                urlPrefix: '~/',
              },
            }),
          ]
        : []),

      // Optimized PWA configuration
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
          globIgnores: ['**/stats.html', '**/coverage/**', '**/*.map'],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            // HTML pages - Network First
            {
              urlPattern: /^(?!.*\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2)).*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
                networkTimeoutSeconds: 3,
              },
            },
            // API calls - Network First with shorter timeout
            {
              urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 15, // 15 minutes
                },
                networkTimeoutSeconds: 5,
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Images - Cache First with fallback
            {
              urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Fonts - Cache First
            {
              urlPattern: /\.(woff|woff2|ttf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
          ],
        },
        manifest: {
          name: 'MyDub.AI - Your Dubai Guide',
          short_name: 'MyDub.AI',
          description: 'AI-powered information platform for Dubai',
          theme_color: '#0ea5e9',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['travel', 'lifestyle', 'utilities'],
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './'),
      },
    },

    define: {
      'process.env': {},
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    build: {
      // Target modern browsers for smaller bundles
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],

      // Use esbuild for minification (faster than terser)
      minify: isProduction ? 'esbuild' : false,

      // Optimized rollup configuration
      rollupOptions: {
        output: {
          // Smart code splitting
          manualChunks: {
            // React core
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI components
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast', 'framer-motion'],
            // Data & state
            'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js', 'zustand'],
            // Utilities
            'utils-vendor': ['date-fns', 'zod', 'clsx', 'tailwind-merge'],
            // i18n
            'i18n-vendor': ['i18next', 'react-i18next'],
          },

          // Optimize chunk names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
            return `assets/js/${facadeModuleId}-[hash].js`
          },

          // Optimize asset names
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`
            } else if (/woff|woff2|ttf|eot/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`
            } else if (ext === 'css') {
              return `assets/css/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },

          entryFileNames: 'assets/js/[name]-[hash].js',
        },

        // Advanced tree-shaking
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },

      // Increase chunk size limit
      chunkSizeWarningLimit: 1000,

      // Inline small assets
      assetsInlineLimit: 4096, // 4kb

      // Enable CSS code splitting
      cssCodeSplit: true,

      // Source maps only for errors
      sourcemap: isProduction ? 'hidden' : true,

      // Report compressed sizes
      reportCompressedSize: false, // Faster builds

      // Module preload
      modulePreload: {
        polyfill: true,
      },
    },

    // Aggressive dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'i18next',
        'react-i18next',
        '@tanstack/react-query',
        'framer-motion',
        'date-fns',
        'zod',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-toast',
      ],
      exclude: ['@vite/client', '@vite/env'],
      esbuildOptions: {
        target: 'es2020',
      },
    },

    // Development server
    server: {
      port: parseInt(env.VITE_DEV_PORT) || 5173,
      strictPort: false,
      host: true,
      open: false,
      cors: true,
      hmr: {
        overlay: true,
      },
      // Warm up frequently used modules
      warmup: {
        clientFiles: [
          './src/main.tsx',
          './src/App.tsx',
          './src/routes/router.tsx',
        ],
      },
    },

    // Preview server
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT) || 4173,
      host: true,
      strictPort: false,
      cors: true,
    },

    // CSS configuration
    css: {
      devSourcemap: isDevelopment,
      modules: {
        localsConvention: 'camelCase',
      },
    },

    // Esbuild configuration
    esbuild: {
      target: 'es2020',
      drop: isProduction ? ['console', 'debugger'] : [],
      legalComments: 'none',
      treeShaking: true,
    },

    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  }
})