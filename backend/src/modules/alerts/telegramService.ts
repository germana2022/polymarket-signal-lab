import { env } from '../../config/env.js';

export class TelegramService {
  async send(message: string) {
    if (!env.TELEGRAM_ENABLED) return { sent: false, reason: 'TELEGRAM_ENABLED=false' };
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return { sent: false, reason: 'Missing Telegram credentials' };

    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Telegram send failed: ${response.status} ${text}`);
    }
    return { sent: true };
  }
}
