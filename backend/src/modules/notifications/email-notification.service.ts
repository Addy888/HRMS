import { Injectable, Logger } from '@nestjs/common';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<boolean>;
}

// Default provider that just logs the email (simulates sending)
class LogEmailProvider implements EmailProvider {
  private readonly logger = new Logger('LogEmailProvider');

  async send(options: EmailOptions): Promise<boolean> {
    this.logger.log(`[SIMULATED EMAIL SENT]
      To: ${options.to}
      Subject: ${options.subject}
      Body: ${options.body}
      HTML length: ${options.html?.length || 0} characters`);
    return true;
  }
}

@Injectable()
export class EmailNotificationService {
  private provider: EmailProvider;
  private readonly logger = new Logger(EmailNotificationService.name);

  constructor() {
    // Defaulting to the Log provider. In the future, we can configure this to use:
    // SMTP, Resend, AWS SES, or SendGrid based on environment variables.
    this.provider = new LogEmailProvider();
  }

  /**
   * Set dynamic email provider (e.g. SMTP or AWS SES)
   */
  setProvider(provider: EmailProvider) {
    this.provider = provider;
  }

  /**
   * Generic send method
   */
  async sendEmail(to: string, subject: string, message: string, actionUrl?: string): Promise<boolean> {
    const html = this.generateTemplate(subject, message, actionUrl);
    try {
      return await this.provider.send({
        to,
        subject,
        body: message,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  /**
   * Simple clean responsive HTML template generator
   */
  private generateTemplate(title: string, message: string, actionUrl?: string): string {
    const actionBtn = actionUrl
      ? `<div style="margin: 30px 0; text-align: center;">
          <a href="${actionUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Action Item</a>
         </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e5e7eb; }
          .header { background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .content { padding: 40px; line-height: 1.6; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FCS HRMS Portal</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0; color: #111827;">${title}</h2>
            <p>${message}</p>
            ${actionBtn}
          </div>
          <div class="footer">
            <p>&copy; 2026 FCS HRMS. All rights reserved.</p>
            <p>This is an automated system email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
