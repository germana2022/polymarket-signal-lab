# API Contract

## Health

`GET /health`

## Markets

`GET /api/markets/hot`

Returns hot markets sorted by market score.

`GET /api/markets/:id`

Returns one market.

## Wallets

`GET /api/wallets/top`

Returns wallets sorted by score.

`GET /api/wallets/:address`

Returns one wallet.

## Signals

`GET /api/signals/latest`

Returns recent signals.

`GET /api/signals/open`

Returns open/watch signals.

`POST /api/signals/run`

Runs ingestion, buy signal generation, sell monitoring and optional Telegram alerts.

## Paper Trading

`POST /api/paper-trades/open/:signalId`

Opens paper trade for a signal.

`POST /api/paper-trades/close/:signalId`

Closes paper trade using latest snapshot or provided `exitPrice`.

`GET /api/paper-trades/performance`

Returns aggregate paper performance.
