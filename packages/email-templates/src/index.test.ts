import { describe, expect, it } from 'vitest';
import {
  adminInviteEmail,
  applicationAcknowledgementEmail,
  leadNotificationEmail,
  passwordResetEmail,
  submissionAcknowledgementEmail,
} from './index';

const BRAND = {
  companyName: 'Key Tech Solutions',
  siteUrl: 'https://keytech.example',
  supportEmail: 'support@example.invalid',
};

describe('passwordResetEmail', () => {
  it('includes the one-time url and expiry', () => {
    const email = passwordResetEmail(BRAND, {
      name: 'Alex',
      resetUrl: 'https://admin.keytech.example/reset?token=abc',
      expiresInMinutes: 30,
    });
    expect(email.subject).toContain('reset your admin password');
    expect(email.html).toContain('https://admin.keytech.example/reset?token=abc');
    expect(email.text).toContain('30 minutes');
  });

  it('escapes html in user supplied values', () => {
    const email = passwordResetEmail(BRAND, {
      name: '<script>alert(1)</script>',
      resetUrl: 'https://x/reset',
      expiresInMinutes: 30,
    });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});

describe('adminInviteEmail', () => {
  it('lists the assigned roles', () => {
    const email = adminInviteEmail(BRAND, {
      name: 'Sam',
      inviteUrl: 'https://admin/invite?token=x',
      roleNames: ['Content Administrator', 'SEO Manager'],
      expiresInHours: 48,
    });
    expect(email.html).toContain('Content Administrator, SEO Manager');
    expect(email.text).toContain('48 hours');
  });
});

describe('leadNotificationEmail', () => {
  it('renders the reference and admin link', () => {
    const email = leadNotificationEmail(BRAND, {
      reference: 'KTS-Q-000123',
      type: 'Quote request',
      name: 'Dana',
      email: 'dana@example.invalid',
      organization: 'Acme',
      subject: 'Booking platform',
      summary: 'We run twelve venues and need online booking.',
      adminUrl: 'https://admin.keytech.example/growth/leads/1',
    });
    expect(email.subject).toContain('KTS-Q-000123');
    expect(email.html).toContain('Acme');
    expect(email.text).toContain('https://admin.keytech.example/growth/leads/1');
  });
});

describe('acknowledgement emails', () => {
  it('confirms a submission with its reference', () => {
    const email = submissionAcknowledgementEmail(BRAND, {
      name: 'Dana',
      reference: 'KTS-C-000001',
      kind: 'message',
    });
    expect(email.subject).toContain('KTS-C-000001');
    expect(email.html).toContain('KTS-C-000001');
  });

  it('confirms a job application', () => {
    const email = applicationAcknowledgementEmail(BRAND, {
      name: 'Dana',
      roleTitle: 'Backend Engineer',
      reference: 'KTS-A-000007',
    });
    expect(email.html).toContain('Backend Engineer');
    expect(email.text).toContain('KTS-A-000007');
  });
});
