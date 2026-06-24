# Architecture - Fase 1

## Scope

Fase 1 builds a local research and signal laboratory. It identifies buy candidates and sell alerts, but it does not execute real trades.

## Modules

- `DataProvider`: abstracts mock/live data.
- `MarketRepository`: persists markets and price snapshots.
- `WalletRepository`: persists wallets and trades.
- `BuyDecisionEngine`: produces `WATCH`, `BUY_WATCH`, `STRONG_BUY_WATCH`.
- `SellDecisionEngine`: monitors open signals and produces `SELL_WATCH`.
- `PaperTradingRepository`: simulates entries/exits.
- `TelegramService`: optional notification channel.

## Decision Formula

```text
Buy Decision = Market Score + Whale Score + Execution Score
```

Market Score considers volume, liquidity, spread and status.
Whale Score considers number of confirming wallets, average wallet quality and price chase.
Execution Score considers spread, liquidity and how late the current price is versus whale entry.

## Safety

No private keys. No CLOB trading execution. Manual review required.
