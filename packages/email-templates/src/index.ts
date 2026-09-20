/**
 * Transactional email templates.
 *
 * Plain string templates - no framework, no remote assets, inline styles only,
 * because mail clients strip everything else. Secrets are never embedded: a
 * reset email carries a one-time URL built by the caller, and that URL is never
 * logged.
 */

import { brandColors, brandGradient } from '@kts/config';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface EmailBrand {
  companyName: string;
  siteUrl: string;
  supportEmail?: string | null;
}

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(
  brand: EmailBrand,
  heading: string,
  bodyHtml: string,
  cta?: { label: string; href: string },
): string {
  const button = cta
    ? `<tr><td style="padding:24px 32px 8px 32px;">
         <a href="${escape(cta.href)}" style="display:inline-block;background:${brandColors.purple};color:#ffffff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:10px;font-size:15px;">${escape(cta.label)}</a>
       </td></tr>`
    : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(heading)}</title></head>
<body style="margin:0;padding:24px;background:${brandColors.backgroundLight};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${brandColors.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${brandColors.border};">
  <tr><td style="height:6px;background:${brandGradient};"></td></tr>
  <tr><td style="padding:28px 32px 0 32px;">
    <p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${brandColors.textSecondary};">${escape(brand.companyName)}</p>
    <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:${brandColors.ink};">${escape(heading)}</h1>
  </td></tr>
  <tr><td style="padding:16px 32px 0 32px;font-size:15px;line-height:1.65;color:${brandColors.ink};">${bodyHtml}</td></tr>
  ${button}
  <tr><td style="padding:28px 32px 32px 32px;border-top:1px solid ${brandColors.border};margin-top:24px;">
    <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:${brandColors.textSecondary};">
      ${escape(brand.companyName)} &middot; <a href="${escape(brand.siteUrl)}" style="color:${brandColors.purple};">${escape(brand.siteUrl)}</a>
      ${brand.supportEmail ? `<br>Questions? Reply to this email or contact ${escape(brand.supportEmail)}.` : ''}
    </p>
  </td></tr>
</table></body></html>`;
}

export function passwordResetEmail(
  brand: EmailBrand,
  params: { name: string; resetUrl: string; expiresInMinutes: number },
): RenderedEmail {
  const heading = 'Reset your admin password';
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hello ${escape(params.name)},</p>
    <p style="margin:0 0 12px 0;">We received a request to reset the password for your ${escape(brand.companyName)} admin account.</p>
    <p style="margin:0 0 12px 0;">This link can be used once and expires in ${params.expiresInMinutes} minutes.</p>
    <p style="margin:0;">If you did not request this, you can ignore this email. Your password will not change.</p>`;

  return {
    subject: `${brand.companyName} - reset your admin password`,
    html: layout(brand, heading, bodyHtml, {
      label: 'Choose a new password',
      href: params.resetUrl,
    }),
    text: [
      `Hello ${params.name},`,
      '',
      `We received a request to reset the password for your ${brand.companyName} admin account.`,
      `Open this one-time link within ${params.expiresInMinutes} minutes:`,
      params.resetUrl,
      '',
      'If you did not request this, ignore this email. Your password will not change.',
    ].join('\n'),
  };
}

export function adminInviteEmail(
  brand: EmailBrand,
  params: { name: string; inviteUrl: string; roleNames: string[]; expiresInHours: number },
): RenderedEmail {
  const heading = `You have been invited to the ${brand.companyName} admin panel`;
  const roles = params.roleNames.join(', ') || 'no roles yet';
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hello ${escape(params.name)},</p>
    <p style="margin:0 0 12px 0;">An administrator has created an account for you with the following access: <strong>${escape(roles)}</strong>.</p>
    <p style="margin:0;">Set your password within ${params.expiresInHours} hours to activate the account.</p>`;

  return {
    subject: `${brand.companyName} - admin account invitation`,
    html: layout(brand, heading, bodyHtml, { label: 'Set your password', href: params.inviteUrl }),
    text: [
      `Hello ${params.name},`,
      '',
      `An administrator created a ${brand.companyName} admin account for you (${roles}).`,
      `Set your password within ${params.expiresInHours} hours:`,
      params.inviteUrl,
    ].join('\n'),
  };
}

export function leadNotificationEmail(
  brand: EmailBrand,
  params: {
    reference: string;
    type: 'Contact message' | 'Quote request';
    name: string;
    email: string;
    organization?: string | null;
    subject?: string | null;
    summary: string;
    adminUrl: string;
  },
): RenderedEmail {
  const heading = `${params.type}: ${params.reference}`;
  const rows = [
    ['Reference', params.reference],
    ['From', params.name],
    ['Email', params.email],
    ['Organisation', params.organization ?? '-'],
    ['Subject', params.subject ?? '-'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:${brandColors.textSecondary};font-size:13px;white-space:nowrap;">${escape(label)}</td><td style="padding:6px 0;font-size:14px;">${escape(value)}</td></tr>`,
    )
    .join('');

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">${rows}</table>
    <div style="padding:14px 16px;background:${brandColors.softPurple};border-radius:12px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escape(params.summary)}</div>`;

  return {
    subject: `[${brand.companyName}] ${params.type} ${params.reference}`,
    html: layout(brand, heading, bodyHtml, {
      label: 'Open in the admin panel',
      href: params.adminUrl,
    }),
    text: [
      heading,
      '',
      `From: ${params.name} <${params.email}>`,
      params.organization ? `Organisation: ${params.organization}` : '',
      params.subject ? `Subject: ${params.subject}` : '',
      '',
      params.summary,
      '',
      params.adminUrl,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export function submissionAcknowledgementEmail(
  brand: EmailBrand,
  params: { name: string; reference: string; kind: 'message' | 'quote request' },
): RenderedEmail {
  const heading = 'Thank you - we have your enquiry';
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hello ${escape(params.name)},</p>
    <p style="margin:0 0 12px 0;">Thank you for contacting ${escape(brand.companyName)}. Your ${escape(params.kind)} has been received and given the reference <strong>${escape(params.reference)}</strong>.</p>
    <p style="margin:0;">A member of the team will review it and respond by email.</p>`;

  return {
    subject: `${brand.companyName} - we received your ${params.kind} (${params.reference})`,
    html: layout(brand, heading, bodyHtml),
    text: [
      `Hello ${params.name},`,
      '',
      `Thank you for contacting ${brand.companyName}. Your ${params.kind} has been received.`,
      `Reference: ${params.reference}`,
      '',
      'A member of the team will review it and respond by email.',
    ].join('\n'),
  };
}

export function applicationAcknowledgementEmail(
  brand: EmailBrand,
  params: { name: string; roleTitle: string; reference: string },
): RenderedEmail {
  const heading = 'Your application has been received';
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hello ${escape(params.name)},</p>
    <p style="margin:0 0 12px 0;">Thank you for applying for <strong>${escape(params.roleTitle)}</strong> at ${escape(brand.companyName)}.</p>
    <p style="margin:0 0 12px 0;">Your application reference is <strong>${escape(params.reference)}</strong>.</p>
    <p style="margin:0;">We review every application and will contact you if we would like to take the conversation further.</p>`;

  return {
    subject: `${brand.companyName} - application received (${params.reference})`,
    html: layout(brand, heading, bodyHtml),
    text: [
      `Hello ${params.name},`,
      '',
      `Thank you for applying for ${params.roleTitle} at ${brand.companyName}.`,
      `Reference: ${params.reference}`,
      '',
      'We review every application and will contact you if we would like to take the conversation further.',
    ].join('\n'),
  };
}
