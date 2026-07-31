import Header from './components/Header';
import KpiGrid from './components/KpiGrid';
import CashFlowChart from './components/CashFlowChart';
import ScenarioComparison from './components/ScenarioComparison';
import SensitivityPanel from './components/SensitivityPanel';
import RiskPanel from './components/RiskPanel';
import DataCenterScene from './components/three/DataCenterScene';
import MonteCarloPanel from './components/ai/MonteCarloPanel';
import RecommendationPanel from './components/ai/RecommendationPanel';
import RateForecastPanel from './components/ai/RateForecastPanel';
import ScenarioGenerator from './components/ai/ScenarioGenerator';

export default function App() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-6 md:px-10 md:py-10">
      <Header />
      <main className="mt-8 flex flex-1 flex-col gap-6">
        <KpiGrid />
        <DataCenterScene />
        <CashFlowChart />
        <ScenarioComparison />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SensitivityPanel />
          </div>
          <div className="xl:col-span-1">
            <RiskPanel />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-wider text-txt-faint">
            AI analysis
          </span>
          <span className="h-px flex-1 bg-glass-border" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <MonteCarloPanel />
          </div>
          <div className="xl:col-span-1">
            <RecommendationPanel />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RateForecastPanel />
          </div>
          <div className="xl:col-span-1">
            <ScenarioGenerator />
          </div>
        </div>
      </main>
      <footer className="mt-10 border-t border-glass-border pt-4 text-xs text-txt-faint">
        Teraval · Barq AI capital-budgeting appraisal · figures in AED millions, verified
        against the reference model · dashboard Stage 5
      </footer>
    </div>
  );
}
