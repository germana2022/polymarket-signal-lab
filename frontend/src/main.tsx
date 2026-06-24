import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { apiGet, apiPost } from './api.js';
import './styles.css';

type Signal = {
  id: number;
  title: string;
  action: string;
  side: string;
  current_price: string;
  market_score: string;
  whale_score: string;
  execution_score: string;
  confidence: string;
  status: string;
  reason: string;
  stop_loss: string;
  take_profit_1: string;
  take_profit_2: string;
};

function App() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const [s, m, w, p] = await Promise.all([
        apiGet<Signal[]>('/api/signals/latest'),
        apiGet<any[]>('/api/markets/hot'),
        apiGet<any[]>('/api/wallets/top'),
        apiGet<any>('/api/paper-trades/performance'),
      ]);
      setSignals(s);
      setMarkets(m);
      setWallets(w);
      setPerformance(p);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function runSignals() {
    setLoading(true);
    try {
      await apiPost('/api/signals/run');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main>
      <header>
        <div>
          <h1>Polymarket Signal Lab</h1>
          <p>Fase 1 · Señales, paper trading y alertas. Sin auto-trading.</p>
        </div>
        <button onClick={runSignals} disabled={loading}>{loading ? 'Running...' : 'Run Signals'}</button>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="cards">
        <Metric title="Signals" value={signals.length} />
        <Metric title="Hot Markets" value={markets.length} />
        <Metric title="Top Wallets" value={wallets.length} />
        <Metric title="Paper PnL" value={Number(performance?.total_pnl ?? 0).toFixed(2)} />
      </section>

      <section>
        <h2>Latest Signals</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Action</th><th>Market</th><th>Side</th><th>Price</th><th>Scores</th><th>Exit</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s) => (
                <tr key={s.id}>
                  <td><span className={`badge ${s.action}`}>{s.action}</span></td>
                  <td>{s.title}</td>
                  <td>{s.side}</td>
                  <td>{Number(s.current_price).toFixed(4)}</td>
                  <td>M {s.market_score} / W {s.whale_score} / E {s.execution_score}</td>
                  <td>SL {Number(s.stop_loss).toFixed(4)} · TP1 {Number(s.take_profit_1).toFixed(4)}</td>
                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid2">
        <Panel title="Hot Markets" rows={markets.slice(0, 8)} fields={[['title','Market'], ['market_score','Score'], ['volume','Volume'], ['liquidity','Liquidity']]} />
        <Panel title="Top Wallets" rows={wallets.slice(0, 8)} fields={[['address','Wallet'], ['wallet_score','Score'], ['roi','ROI'], ['total_profit','Profit']]} />
      </section>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return <div className="metric"><span>{title}</span><strong>{value}</strong></div>;
}

function Panel({ title, rows, fields }: { title: string; rows: any[]; fields: [string,string][] }) {
  return <section>
    <h2>{title}</h2>
    <div className="tableWrap compact"><table><thead><tr>{fields.map(([,label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((r, idx) => <tr key={idx}>{fields.map(([key]) => <td key={key}>{String(r[key] ?? '').slice(0, 64)}</td>)}</tr>)}</tbody></table></div>
  </section>;
}

createRoot(document.getElementById('root')!).render(<App />);
