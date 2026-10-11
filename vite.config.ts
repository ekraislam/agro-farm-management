import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  build: {
    // Target modern browsers for smaller output (ES2020 supports all phones manufactured after 2020)
    target: 'es2020',

    // Increase chunk size warning limit (we split manually below)
    chunkSizeWarningLimit: 600,

    // Minification: use oxc (fastest available in this Vite version)
    minify: true,

    // CSS code splitting — only load the CSS needed per chunk
    cssCodeSplit: true,

    // Source maps off in production (saves bandwidth)
    sourcemap: false,

    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps initial bundle tiny
        manualChunks(id) {
          // Vendor: React core (always needed first)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }

          // Vendor: Supabase (only needed when user logs in)
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }

          // Vendor: Lucide icons (large lib, separate chunk with long-term cache)
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }

          // Heavy views: split each into its own chunk (lazy-loaded via React.lazy)
          if (id.includes('src/components/views/ReportsView')) return 'view-reports';
          if (id.includes('src/components/views/RemindersView')) return 'view-reminders';
          if (id.includes('src/components/views/BiogasView')) return 'view-biogas';
          if (id.includes('src/components/views/EmployeesView')) return 'view-employees';
          if (id.includes('src/components/views/FinanceView')) return 'view-finance';
          if (id.includes('src/components/views/CowsView')) return 'view-cows';
          if (id.includes('src/components/views/MilkRecordsView')) return 'view-milk';
          if (id.includes('src/components/views/AdvisorView')) return 'view-advisor';
          if (id.includes('src/components/views/SettingsView')) return 'view-settings';

          // Services: AI advisor only loaded on-demand
          if (id.includes('src/services/aiAdvisorService')) return 'service-ai';
          if (id.includes('src/services/farmRepository')) return 'service-repo';

          // Utils: farm reports (big, only used in ReportsView)
          if (id.includes('src/utils/farmReports')) return 'util-reports';
        },

        // Asset filenames with content-hash for perfect long-term caching
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? '';
          if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.css$/i.test(name)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },

  // Pre-bundle these for faster dev server cold starts
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'lucide-react',
    ],
  },
});
