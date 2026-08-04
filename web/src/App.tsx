import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import BackgroundFX from './components/BackgroundFX';
import TabNav from './components/TabNav';
import type { TabDef } from './components/TabNav';
import DecisionBrief from './components/DecisionBrief';
import KpiGrid from './components/KpiGrid';
import CashFlowChart from './components/CashFlowChart';
import AlternativesPanel from './components/AlternativesPanel';
import ScenarioComparison from './components/ScenarioComparison';
import SensitivityPanel from './components/SensitivityPanel';
import RiskPanel from './components/RiskPanel';
import DecisionThresholds from './components/DecisionThresholds';
import EthicsPanel from './components/EthicsPanel';
import AssumptionsAudit from './components/AssumptionsAudit';
import DataProvenance from './components/DataProvenance';
import BoardReview from './components/BoardReview';
import DataCenterScene from './components/three/DataCenterScene';
import MonteCarloPanel from './components/ai/MonteCarloPanel';
import RecommendationPanel from './components/ai/RecommendationPanel';
import RateForecastPanel from './components/ai/RateForecastPanel';
import ScenarioGenerator from './components/ai/ScenarioGenerator';
import PredictiveAI from './components/ai/PredictiveAI';
import AssistantWidget from './components/ai/AssistantWidget';
import PrintSummary from './components/PrintSummary';

// Five tabs grouped by the decision narrative — every earlier view is kept, now
// organised into labelled sections inside these tabs.
const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'financials', label: 'Cash Flow & Build-vs-Rent' },
  { id: 'scenarios', label: 'Scenarios & Sensitivity' },
  { id: 'ai', label: 'AI & Forecasting' },
  { id: 'governance', label: 'Board & Ethics' },
];

/** A thin section divider so merged tabs keep each view's identity. */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-txt-dim">{children}</h2>
      <div className="h-px flex-1 bg-glass-border" />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('overview');

  return (
    <>
      <BackgroundFX />
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-6 md:px-10 md:py-10">
        <Header />
        <TabNav tabs={TABS} active={tab} onChange={setTab} />

        <main className="mt-6 flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col gap-6"
            >
              {tab === 'overview' && (
                <>
                  <DecisionBrief />
                  <SectionLabel>The asset — live 3D hall</SectionLabel>
                  <DataCenterScene />
                  <SectionLabel>The scorecard — key metrics</SectionLabel>
                  <KpiGrid />
                  <SectionLabel>The synthesis — AI recommendation</SectionLabel>
                  <RecommendationPanel />
                </>
              )}

              {tab === 'financials' && (
                <>
                  <SectionLabel>Cash flow over the 8-year life</SectionLabel>
                  <CashFlowChart />
                  <SectionLabel>Build vs Rent (Equivalent Annual Cost)</SectionLabel>
                  <AlternativesPanel />
                </>
              )}

              {tab === 'scenarios' && (
                <>
                  <SectionLabel>Optimistic / base / pessimistic</SectionLabel>
                  <ScenarioComparison />
                  <SectionLabel>Decision thresholds & sensitivity</SectionLabel>
                  <DecisionThresholds />
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                      <SensitivityPanel />
                    </div>
                    <div className="xl:col-span-1">
                      <RiskPanel />
                    </div>
                  </div>
                </>
              )}

              {tab === 'ai' && (
                <>
                  <SectionLabel>Simulation & scenario AI</SectionLabel>
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                      <MonteCarloPanel />
                    </div>
                    <div className="xl:col-span-1">
                      <ScenarioGenerator />
                    </div>
                  </div>
                  <RateForecastPanel />
                  <SectionLabel>Trained machine-learning models</SectionLabel>
                  <PredictiveAI />
                </>
              )}

              {tab === 'governance' && (
                <>
                  <SectionLabel>Departmental board review</SectionLabel>
                  <BoardReview />
                  <SectionLabel>Ethics, provenance & audit</SectionLabel>
                  <EthicsPanel />
                  <DataProvenance />
                  <AssumptionsAudit />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mt-10 border-t border-glass-border pt-4 text-xs text-txt-faint">
          Teraval · Barq AI capital-budgeting appraisal · figures in AED millions, verified
          against the reference model
        </footer>
      </div>

      {/* Floating AI assistant — available on every tab, aware of the current one. */}
      <AssistantWidget currentTab={tab} />

      {/* Print-only one-page decision summary (header "Download summary" → Save as PDF). */}
      <PrintSummary />
    </>
  );
}
