CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  category TEXT,
  end_date TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  enable_order_book BOOLEAN DEFAULT TRUE,
  volume NUMERIC DEFAULT 0,
  liquidity NUMERIC DEFAULT 0,
  open_interest NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_snapshots (
  id BIGSERIAL PRIMARY KEY,
  market_id TEXT REFERENCES markets(id),
  outcome TEXT NOT NULL,
  price NUMERIC NOT NULL,
  best_bid NUMERIC,
  best_ask NUMERIC,
  spread NUMERIC,
  volume NUMERIC DEFAULT 0,
  liquidity NUMERIC DEFAULT 0,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  address TEXT PRIMARY KEY,
  total_profit NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  markets_traded INTEGER DEFAULT 0,
  avg_position_size NUMERIC DEFAULT 0,
  wallet_score NUMERIC DEFAULT 0,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_trades (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT REFERENCES wallets(address),
  market_id TEXT REFERENCES markets(id),
  outcome TEXT NOT NULL,
  side TEXT NOT NULL,
  price NUMERIC NOT NULL,
  size NUMERIC NOT NULL,
  notional_value NUMERIC NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signals (
  id BIGSERIAL PRIMARY KEY,
  market_id TEXT REFERENCES markets(id),
  side TEXT NOT NULL,
  action TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  market_score NUMERIC NOT NULL,
  whale_score NUMERIC NOT NULL,
  execution_score NUMERIC NOT NULL,
  data_confidence TEXT NOT NULL DEFAULT 'MEDIUM',
  confidence TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signal_exit_rules (
  id BIGSERIAL PRIMARY KEY,
  signal_id BIGINT REFERENCES signals(id) ON DELETE CASCADE,
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  take_profit_1 NUMERIC NOT NULL,
  take_profit_2 NUMERIC NOT NULL,
  max_hold_hours INTEGER NOT NULL,
  exit_if_market_score_below NUMERIC NOT NULL,
  exit_if_spread_above NUMERIC NOT NULL,
  exit_if_whales_sell BOOLEAN DEFAULT TRUE,
  close_near_resolution_if_risk_unknown BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS paper_trades (
  id BIGSERIAL PRIMARY KEY,
  signal_id BIGINT REFERENCES signals(id) ON DELETE CASCADE,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  size_usd NUMERIC NOT NULL,
  pnl NUMERIC,
  roi NUMERIC,
  status TEXT NOT NULL,
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_snapshots_market_time ON market_snapshots(market_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_trades_wallet_time ON wallet_trades(wallet_address, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_signals_status_time ON signals(status, created_at DESC);
