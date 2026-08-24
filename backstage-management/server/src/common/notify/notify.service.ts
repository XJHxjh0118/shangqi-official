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

    if (this.isOpsSmtpConfigured()) {
      tasks.push(this.sendSmtp(payload, this.config.get<string>('NOTIFY_TO')!));
    }

    if (!tasks.length) {
      this.logger.log(`[notify] ${payload.subject}`);
      return;
    }

    await Promise.allSettled(tasks);
  }

  async sendTo(to: string, payload: NotifyPayload): Promise<boolean> {
    if (!to) return false;
    if (!this.hasSmtpTransport()) {
      this.logger.log(`[mail:${to}] ${payload.subject}\n${payload.text}`);
      return false;
    }
    try {
      await this.sendSmtp(payload, to);
      return true;
    } catch (err) {
      this.logger.warn(`SMTP user mail error: ${String(err)}`);
      return false;
    }
  }

  hasSmtpTransport(): boolean {
    return Boolean(this.config.get('SMTP_HOST') && this.config.get('SMTP_FROM'));
  }

  private isOpsSmtpConfigured(): boolean {
    return this.hasSmtpTransport() && Boolean(this.config.get('NOTIFY_TO'));
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

  private async sendSmtp(payload: NotifyPayload, to: string): Promise<void> {
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
      to,
      subject: payload.subject,
      text: payload.text,
    });
  }
}
