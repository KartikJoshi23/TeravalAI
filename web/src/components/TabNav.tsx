/**
 * TabNav — the dashboard's section navigation. A sticky glass bar with an
 * animated sliding pill (Framer Motion `layoutId`) marking the active tab, so
 * the single-page dump becomes six focused, easy-to-scan views.
 */
import type { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';

export interface TabDef {
  id: string;
  label: string;
}

export default function TabNav({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  // Complete the ARIA tabs pattern: roving tabindex + arrow-key navigation, and
  // each tab points at the panel it controls (App renders role="tabpanel").
  const onKeyDown = (ev: KeyboardEvent<HTMLElement>) => {
    const idx = tabs.findIndex((t) => t.id === active);
    let next: number | null = null;
    if (ev.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (ev.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (ev.key === 'Home') next = 0;
    else if (ev.key === 'End') next = tabs.length - 1;
    if (next !== null) {
      ev.preventDefault();
      onChange(tabs[next].id);
      const el = (ev.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(
        `#tab-${tabs[next].id}`,
      );
      el?.focus();
    }
  };

  return (
    <nav
      role="tablist"
      aria-label="Dashboard sections"
      onKeyDown={onKeyDown}
      className="topbar sticky top-0 z-30 mt-6 flex flex-wrap items-center gap-1 p-1.5"
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`panel-${t.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive ? 'text-txt' : 'text-txt-dim hover:text-txt'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg border border-blue/30 bg-blue/12"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
