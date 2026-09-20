'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LEAD_STATUS_LABEL,
  type AdminUserDto,
  type LeadDto,
  type Paginated,
} from '@kts/shared-types';
import {
  Badge,
  Button,
  Field,
  Grid,
  LinkButton,
  Mono,
  Notice,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
  Textarea,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

/**
 * A single enquiry.
 *
 * An attachment is never linked directly: the panel asks the API for a
 * short-lived signed URL, and that request is recorded in the audit log.
 */
export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { can } = useSession();
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const lead = useQuery<LeadDto>({
    queryKey: ['leads', params.id],
    queryFn: () => adminApi.lead(params.id),
    enabled: can('leads:read'),
  });

  const users = useQuery<Paginated<AdminUserDto>>({
    queryKey: ['users', 'assignable'],
    queryFn: () => adminApi.users({ pageSize: 100 }),
    enabled: can('users:read'),
  });

  const update = useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminApi.updateLead(params.id, payload),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Lead updated.' });
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const addNote = useMutation({
    mutationFn: () => adminApi.addLeadNote(params.id, { body: note, isInternal: true }),
    onSuccess: () => {
      setNote('');
      setMessage({ tone: 'success', text: 'Note added.' });
      void queryClient.invalidateQueries({ queryKey: ['leads', params.id] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const download = useMutation({
    mutationFn: (documentId: string) => adminApi.documentDownloadLink(documentId),
    onSuccess: (result) => window.open(result.url, '_blank', 'noopener,noreferrer'),
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('leads:read')) {
    return (
      <>
        <PageHeader title="Lead" />
        <Notice tone="warning" title="No access">
          Your role does not include leads:read.
        </Notice>
      </>
    );
  }

  if (lead.isPending) return <Notice tone="info">Loading enquiry...</Notice>;
  if (lead.isError) {
    return (
      <Notice tone="error" title="Could not load this enquiry">
        {describeError(lead.error)}
      </Notice>
    );
  }

  const record = lead.data;

  return (
    <>
      <PageHeader
        title={record.reference}
        description={`${record.type === 'QUOTE' ? 'Quote request' : 'Contact message'} received ${new Date(record.createdAt).toLocaleString('en-GB')}`}
        actions={
          <LinkButton href="/growth/leads" variant="ghost">
            Back to leads
          </LinkButton>
        }
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {record.spamScore >= 0.7 ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone="warning" title="Flagged as likely spam">
            This submission scored {record.spamScore.toFixed(2)} on the spam heuristic. It was kept
            so a person can judge it; mark it as spam if that is right, or move it back into the
            pipeline.
          </Notice>
        </div>
      ) : null}

      <Grid columns={2}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Enquiry">
            <dl style={{ display: 'grid', gap: 10, margin: 0 }}>
              <Detail label="Name" value={record.name} />
              <Detail label="Email" value={<a href={`mailto:${record.email}`}>{record.email}</a>} />
              {record.mobile ? <Detail label="Mobile" value={record.mobile} /> : null}
              {record.organization ? (
                <Detail label="Organisation" value={record.organization} />
              ) : null}
              {record.serviceInterest ? (
                <Detail label="Service interest" value={record.serviceInterest} />
              ) : null}
              {record.subject ? <Detail label="Subject" value={record.subject} /> : null}
              {record.sourcePage ? (
                <Detail label="Submitted from" value={<Mono>{record.sourcePage}</Mono>} />
              ) : null}
            </dl>

            {record.message ? (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  background: 'var(--kt-surface-muted)',
                  borderRadius: 10,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {record.message}
              </div>
            ) : null}
          </Panel>

          {record.quote ? (
            <Panel title="Quote details">
              <dl style={{ display: 'grid', gap: 10, margin: 0 }}>
                <Detail label="Project type" value={record.quote.projectType} />
                {record.quote.budgetRange ? (
                  <Detail label="Budget range" value={record.quote.budgetRange} />
                ) : null}
                {record.quote.preferredStart ? (
                  <Detail label="Preferred start" value={record.quote.preferredStart} />
                ) : null}
                {record.quote.existingSystem ? (
                  <Detail label="Existing system" value={record.quote.existingSystem} />
                ) : null}
              </dl>
              {record.quote.requiredFeatures.length > 0 ? (
                <div style={{ marginTop: 12 }}>
                  <p className={styles.label}>Required features</p>
                  <div className={styles.chipRow} style={{ marginTop: 6 }}>
                    {record.quote.requiredFeatures.map((feature) => (
                      <Badge key={feature}>{feature}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  background: 'var(--kt-surface-muted)',
                  borderRadius: 10,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {record.quote.businessChallenge}
              </div>
            </Panel>
          ) : null}

          {record.attachment ? (
            <Panel title="Attachment">
              <div className={styles.spread}>
                <div>
                  <p style={{ fontWeight: 600 }}>{record.attachment.originalName}</p>
                  <p className={styles.cellMuted}>
                    {record.attachment.extension.toUpperCase()} &middot;{' '}
                    {Math.max(1, Math.round(record.attachment.sizeBytes / 1024))} KB &middot; stored
                    privately
                  </p>
                </div>
                <Button
                  disabled={!can('documents:download') || download.isPending}
                  onClick={() => download.mutate(record.attachment!.id)}
                >
                  {download.isPending ? 'Preparing...' : 'Download'}
                </Button>
              </div>
              <div style={{ marginTop: 10 }}>
                <Notice tone="info">
                  Downloads use a link that expires in five minutes and are recorded in the audit
                  log.
                </Notice>
              </div>
            </Panel>
          ) : null}
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Status and assignment">
            <div className={styles.stack}>
              <div className={styles.inline}>
                <span>Current:</span>
                <StatusBadge status={record.leadStatus} />
              </div>

              <Field label="Status">
                {({ id }) => (
                  <Select
                    id={id}
                    value={record.leadStatus}
                    disabled={!can('leads:update')}
                    onChange={(event) => update.mutate({ leadStatus: event.target.value })}
                  >
                    {Object.entries(LEAD_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label="Assigned to" optional>
                {({ id }) => (
                  <Select
                    id={id}
                    value={record.assignedTo?.id ?? ''}
                    disabled={!can('leads:update')}
                    onChange={(event) =>
                      update.mutate({ assignedToId: event.target.value || null })
                    }
                  >
                    <option value="">Unassigned</option>
                    {(users.data?.items ?? []).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </Panel>

          <Panel title="Internal notes">
            <div className={styles.stack}>
              <Field
                label="Add a note"
                hint="Internal only. Never shown to the person who enquired."
              >
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    disabled={!can('leads:update')}
                  />
                )}
              </Field>
              <Button
                variant="primary"
                disabled={!can('leads:update') || note.trim().length === 0 || addNote.isPending}
                onClick={() => addNote.mutate()}
              >
                {addNote.isPending ? 'Saving...' : 'Add note'}
              </Button>

              <div className={styles.stackTight}>
                {record.notes.length === 0 ? (
                  <p className={styles.cellMuted}>No notes yet.</p>
                ) : (
                  record.notes.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: 12,
                        border: '1px solid var(--kt-border-default)',
                        borderRadius: 10,
                      }}
                    >
                      <p style={{ whiteSpace: 'pre-wrap' }}>{entry.body}</p>
                      <p className={styles.cellMuted} style={{ marginTop: 6 }}>
                        {entry.authorName ?? 'Unknown'} &middot;{' '}
                        {new Date(entry.createdAt).toLocaleString('en-GB')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Panel>
        </div>
      </Grid>
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10 }}>
      <dt className={styles.cellMuted}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}
