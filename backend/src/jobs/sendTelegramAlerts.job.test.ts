import { describe, expect, it, vi } from 'vitest';

const envMock = { TELEGRAM_ENABLED: false, WORKER_SEND_TELEGRAM_ALERTS_INTERVAL_SECONDS: 60 };
const queryMock = vi.fn();
const sendMock = vi.fn();

vi.mock('../config/env.js', () => ({
  env: envMock,
}));

vi.mock('../db/pool.js', () => ({
  query: (...args: unknown[]) => queryMock(...args),
}));

vi.mock('../modules/alerts/telegramService.js', () => ({
  TelegramService: vi.fn().mockImplementation(() => ({
    send: sendMock,
  })),
}));

vi.mock('../modules/alerts/alertFormatter.js', () => ({
  formatSignalAlert: (signal: unknown) => `alert:${JSON.stringify(signal)}`,
}));

describe('SendTelegramAlertsJob', () => {
  it('returns early when telegram is disabled', async () => {
    const { SendTelegramAlertsJob } = await import('./sendTelegramAlerts.job.js');
    const job = new SendTelegramAlertsJob();
    const result = await job.run();

    expect(result).toEqual({ alertsSent: 0, reason: 'TELEGRAM_ENABLED=false' });
    expect(queryMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('queries sell/watch and watch/create windows based on configured alert interval', async () => {
    envMock.TELEGRAM_ENABLED = true;
    queryMock.mockResolvedValueOnce([{ id: 1 }]);

    const { SendTelegramAlertsJob } = await import('./sendTelegramAlerts.job.js');
    const job = new SendTelegramAlertsJob();
    const result = await job.run();

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('NOW() - ($1 || \' seconds\')::interval'),
      [120],
    );
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expect.objectContaining({ alertsSent: 1 }));
  });
});
