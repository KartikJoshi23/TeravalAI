import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import BackgroundFX from './components/BackgroundFX';
import TabNav from './components/TabNav';
import type { TabDef } from './components/TabNav';
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
import DataCenterScene from './components/three/DataCenterScene';
import MonteCarloPanel from './components/ai/MonteCarloPanel';
import RecommendationPanel from './components/ai/RecommendationPanel';
import RateForecastPanel from './components/ai/RateForecastPanel';
import ScenarioGenerator from './components/ai/ScenarioGenerator';
import AssistantWidget from './components/ai/AssistantWidget';

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'cashflow', label: 'Cash Flow' },
  { id: 'buildrent', label: 'Build vs Rent' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'sensitivity', label: 'Sensitivity & Risk' },
  { id: 'ai', label: 'AI Analysis' },
  { id: 'ethics', label: 'Ethics & Audit' },
];

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
                  <DataCenterScene />
                  <KpiGrid />
                  <RecommendationPanel />
                </>
              )}

              {tab === 'cashflow' && <CashFlowChart />}

              {tab === 'buildrent' && <AlternativesPanel />}

              {tab === 'scenarios' && <ScenarioComparison />}

              {tab === 'sensitivity' && (
                <>
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

              {tab === 'ethics' && (
                <>
                  <EthicsPanel />
                  <DataProvenance />
                  <AssumptionsAudit />
                </>
              )}

              {tab === 'ai' && (
                <>
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                      <MonteCarloPanel />
                    </div>
                    <div className="xl:col-span-1">
                      <ScenarioGenerator />
                    </div>
                  </div>
                  <RateForecastPanel />
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
    </>
  );
}
