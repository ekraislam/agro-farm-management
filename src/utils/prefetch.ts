/**
 * Momin Agro — Prefetch Manager
 * 
 * Preloads the NEXT most-likely view after the dashboard renders.
 * Uses requestIdleCallback so it never blocks the main thread.
 * Result: Tab switching feels INSTANT after the initial load.
 */

type PreloadEntry = {
  loader: () => Promise<unknown>;
  preloaded: boolean;
};

const viewPreloaders: Record<string, PreloadEntry> = {
  cows: {
    loader: () => import('../components/views/CowsView'),
    preloaded: false,
  },
  milk: {
    loader: () => import('../components/views/MilkRecordsView'),
    preloaded: false,
  },
  finance: {
    loader: () => import('../components/views/FinanceView'),
    preloaded: false,
  },
  employees: {
    loader: () => import('../components/views/EmployeesView'),
    preloaded: false,
  },
  biogas: {
    loader: () => import('../components/views/BiogasView'),
    preloaded: false,
  },
  reminders: {
    loader: () => import('../components/views/RemindersView'),
    preloaded: false,
  },
  reports: {
    loader: () => import('../components/views/ReportsView'),
    preloaded: false,
  },
  advisor: {
    loader: () => import('../components/views/AdvisorView'),
    preloaded: false,
  },
  settings: {
    loader: () => import('../components/views/SettingsView'),
    preloaded: false,
  },
};

/**
 * After dashboard loads, preload high-traffic views (cows, milk, finance)
 * in the background during browser idle time.
 */
export function prefetchCommonViews() {
  const PRIORITY_VIEWS = ['cows', 'milk', 'finance', 'reminders'];

  const preloadNext = (views: string[], index = 0) => {
    if (index >= views.length) return;
    const key = views[index];
    const entry = viewPreloaders[key];
    if (!entry || entry.preloaded) {
      preloadNext(views, index + 1);
      return;
    }

    const schedule = typeof requestIdleCallback !== 'undefined'
      ? (fn: () => void) => requestIdleCallback(fn, { timeout: 3000 })
      : (fn: () => void) => setTimeout(fn, 500 + index * 800);

    schedule(() => {
      entry.loader()
        .then(() => {
          entry.preloaded = true;
          // Chain: preload next after this one finishes
          preloadNext(views, index + 1);
        })
        .catch(() => {
          // Non-critical: ignore prefetch errors
        });
    });
  };

  preloadNext(PRIORITY_VIEWS);
}

/**
 * Preload a specific view on hover/focus — called when user hovers a nav item
 */
export function prefetchView(viewKey: string) {
  const entry = viewPreloaders[viewKey];
  if (!entry || entry.preloaded) return;
  entry.loader()
    .then(() => { entry.preloaded = true; })
    .catch(() => {});
}
