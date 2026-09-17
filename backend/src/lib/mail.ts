import { Resend } from 'resend';

function env(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function mailFromAddress(): string {
  const address = env('EMAIL_FROM') ?? 'developer@sitesync.uk';
  const name = env('EMAIL_FROM_NAME') ?? 'SiteSync';
  return `${name} <${address}>`;
}

let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = env('RESEND_API_KEY');
  if (!apiKey) return null;
  if (client) return client;
  client = new Resend(apiKey);
  return client;
}

export async function sendMail(opts: { to: string; subject: string; text: string; html: string }): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn('[mail] RESEND_API_KEY not configured - skipping email send');
    return false;
  }
  const { error } = await resend.emails.send({
    from: mailFromAddress(),
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  if (error) {
    console.error('[mail] Resend send failed', error);
    return false;
  }
  return true;
}
