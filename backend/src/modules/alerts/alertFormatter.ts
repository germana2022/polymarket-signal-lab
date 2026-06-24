export function formatSignalAlert(signal: any): string {
  return [
    '🚨 *Polymarket Signal Lab*',
    '',
    `*Action:* ${signal.action}`,
    `*Market:* ${signal.title ?? signal.market_id}`,
    `*Side:* ${signal.side}`,
    `*Price:* ${Number(signal.current_price).toFixed(4)}`,
    `*Confidence:* ${signal.confidence}`,
    '',
    `*Scores:* Market ${signal.market_score} / Whale ${signal.whale_score} / Execution ${signal.execution_score}`,
    `*Data confidence:* ${signal.data_confidence ?? 'UNKNOWN'}`,
    '',
    `*Exit:* SL ${Number(signal.stop_loss ?? 0).toFixed(4)} | TP1 ${Number(signal.take_profit_1 ?? 0).toFixed(4)} | TP2 ${Number(signal.take_profit_2 ?? 0).toFixed(4)}`,
    '',
    `*Reason:* ${signal.reason}`,
    '',
    '_Manual review only. No auto-trading enabled._',
  ].join('\n');
}
