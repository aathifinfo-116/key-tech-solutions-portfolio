import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import type { RenderedEmail } from '@kts/email-templates';
import { AppConfig } from '../../config/app-config';

export interface SendOptions {
  to: string;
  replyTo?: string;
}

/**
 * Outbound email.
 *
 * MAIL_DRIVER=log (the default for local development) renders the message to
 * the application log and delivers nothing, so development never emails a real
 * person by accident. Reset links and tokens are redacted from those log lines.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: AppConfig) {}

  private getTransporter(): Transporter | null {
    if (this.config.mail.driver !== 'smtp') return null;
    if (this.transporter) return this.transporter;

    const { host, port, secure, user, password } = this.config.mail.smtp;
    if (!host) {
      this.logger.error('MAIL_DRIVER=smtp but SMTP_HOST is not set; email will not be delivered.');
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: password } : undefined,
    });
    return this.transporter;
  }

  async send(email: RenderedEmail, options: SendOptions): Promise<{ delivered: boolean }> {
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.log(
        `[mail:log] to=${options.to} subject="${email.subject}" body="${redactLinks(email.text).slice(0, 400)}"`,
      );
      return { delivered: false };
    }

    try {
      await transporter.sendMail({
        from: this.config.mail.from,
        to: options.to,
        replyTo: options.replyTo,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      this.logger.log(`Sent "${email.subject}" to ${maskEmail(options.to)}`);
      return { delivered: true };
    } catch (error) {
      // A failed notification must not fail the visitor's form submission.
      this.logger.error(
        `Failed to send "${email.subject}"`,
        error instanceof Error ? error.stack : String(error),
      );
      return { delivered: false };
    }
  }

  /** Internal notification address, if one is configured. */
  get notifyAddress(): string | undefined {
    return this.config.mail.notifyTo || undefined;
  }
}

/** Strips query strings from URLs so one-time tokens never reach the log. */
export function redactLinks(text: string): string {
  return text.replace(/(https?:\/\/[^\s?]+)\?[^\s]*/g, '$1?[redacted]');
}

/** a***@example.com - enough to correlate, not enough to harvest. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[invalid]';
  return `${local.slice(0, 1)}***@${domain}`;
}
