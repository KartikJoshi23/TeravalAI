import Header from './components/Header';
import KpiGrid from './components/KpiGrid';
import CashFlowChart from './components/CashFlowChart';
import ScenarioComparison from './components/ScenarioComparison';
import SensitivityPanel from './components/SensitivityPanel';
import RiskPanel from './components/RiskPanel';

export default function App() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-6 md:px-10 md:py-10">
      <Header />
      <main className="mt-8 flex flex-1 flex-col gap-6">
        <KpiGrid />
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
      </main>
      <footer className="mt-10 border-t border-glass-border pt-4 text-xs text-txt-faint">
        Teraval · Barq AI capital-budgeting appraisal · figures in AED millions, verified
        against the reference model · dashboard Stage 3
      </footer>
    </div>
  );
}
