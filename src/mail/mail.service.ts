import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

interface SafeMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface MailResult {
  envelope?: {
    from?: string;
    to?: string[];
  };
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? '',
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER ?? '',
        pass: process.env.MAIL_PASS ?? '',
      },
    });
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private async safeSendMail(options: SafeMailOptions): Promise<MailResult> {
    const raw: unknown = await this.transporter.sendMail(options);

    if (!this.isRecord(raw)) {
      throw new Error('Invalid mail response');
    }

    const r = raw;

    let envelopeFrom: string | undefined = undefined;
    let envelopeTo: string[] = [];

    if (this.isRecord(r.envelope)) {
      const env = r.envelope;

      if (typeof env.from === 'string') envelopeFrom = env.from;

      if (Array.isArray(env.to)) envelopeTo = env.to.map((v) => String(v));
      else if (typeof env.to === 'string') envelopeTo = [env.to];
    }

    return {
      envelope: {
        from: envelopeFrom,
        to: envelopeTo,
      },
      messageId: typeof r.messageId === 'string' ? r.messageId : '',
      accepted: Array.isArray(r.accepted) ? r.accepted.map(String) : [],
      rejected: Array.isArray(r.rejected) ? r.rejected.map(String) : [],
      pending: Array.isArray(r.pending) ? r.pending.map(String) : [],
      response: typeof r.response === 'string' ? r.response : '',
    };
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    from?: string, // 👈 NEW
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const mailOptions: SafeMailOptions = {
        from: from ?? `"Your App" <${process.env.MAIL_USER ?? ''}>`, // 👈 dynamic sender
        to,
        subject,
        html,
      };

      const info = await this.safeSendMail(mailOptions);

      this.logger.log(`Email sent: ${info.messageId}`);

      return { success: true };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Email failed', errMsg);

      return { success: false, error: errMsg };
    }
  }
}
