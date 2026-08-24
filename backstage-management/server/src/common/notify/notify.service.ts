import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type NotifyPayload = {
  subject: string;
  text: string;
};

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(private readonly config: ConfigService) {}

  async send(payload: NotifyPayload): Promise<void> {
    const tasks: Promise<void>[] = [];

    const webhook = this.config.get<string>('NOTIFY_WEBHOOK_URL');
    if (webhook) {
      tasks.push(this.sendWebhook(webhook, payload));
    }

    if (this.isSmtpConfigured()) {
      tasks.push(this.sendSmtp(payload));
    }

    if (!tasks.length) {
      this.logger.log(`[notify] ${payload.subject}`);
      return;
    }

    await Promise.allSettled(tasks);
  }

  private isSmtpConfigured(): boolean {
    return Boolean(
      this.config.get('SMTP_HOST') &&
        this.config.get('SMTP_FROM') &&
        this.config.get('NOTIFY_TO'),
    );
  }

  private async sendWebhook(url: string, payload: NotifyPayload): Promise<void> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        this.logger.warn(`Webhook notify failed: ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(`Webhook notify error: ${String(err)}`);
    }
  }

  private async sendSmtp(payload: NotifyPayload): Promise<void> {
    try {
      const nodemailer = await import('nodemailer');
      const transport = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST'),
        port: Number(this.config.get('SMTP_PORT') || 587),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: this.config.get('SMTP_USER')
          ? {
              user: this.config.get<string>('SMTP_USER'),
              pass: this.config.get<string>('SMTP_PASS'),
            }
          : undefined,
      });

      await transport.sendMail({
        from: this.config.get<string>('SMTP_FROM'),
        to: this.config.get<string>('NOTIFY_TO'),
        subject: payload.subject,
        text: payload.text,
      });
    } catch (err) {
      this.logger.warn(`SMTP notify error: ${String(err)}`);
    }
  }
}
