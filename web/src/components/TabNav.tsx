/**
 * TabNav — the dashboard's section navigation. A sticky glass bar with an
 * animated sliding pill (Framer Motion `layoutId`) marking the active tab, so
 * the single-page dump becomes six focused, easy-to-scan views.
 */
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
  return (
    <nav
      role="tablist"
      aria-label="Dashboard sections"
      className="glass sticky top-3 z-30 mt-6 flex flex-wrap items-center gap-1 p-1.5"
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={isActive}
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
