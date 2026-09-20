'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PUBLIC_MEDIA_FOLDERS, UPLOAD } from '@kts/config';
import type { MediaAssetDto, Paginated } from '@kts/shared-types';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Notice,
  PageHeader,
  Pagination,
  Panel,
  Select,
  Toolbar,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

/**
 * Media library.
 *
 * Uploads are checked on the server for extension, declared type and magic
 * bytes, then re-encoded, which strips EXIF and neutralises polyglot files.
 * Alt text is editable here because an image without it is an accessibility
 * and SEO problem the moment it is used.
 */
export default function MediaPage() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);
  const [folder, setFolder] = useState('content');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const query = useQuery<Paginated<MediaAssetDto>>({
    queryKey: ['media', { page, folder, search }],
    queryFn: () => adminApi.media({ page, pageSize: 24, folder, search: search || undefined }),
    enabled: can('media:read'),
    placeholderData: keepPreviousData,
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('folder', folder);
      formData.append('file', file);
      return adminApi.uploadImage(formData);
    },
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Image uploaded and optimised.' });
      if (fileInput.current) fileInput.current.value = '';
      void queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const saveAlt = useMutation({
    mutationFn: ({ id, altText }: { id: string; altText: string }) =>
      adminApi.updateMedia(id, { altText }),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Alt text saved.' });
      void queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const archive = useMutation({
    mutationFn: (id: string) => adminApi.archiveMedia(id),
    onSuccess: () => {
      setMessage({
        tone: 'success',
        text: 'Image archived. Pages referencing it fall back to a placeholder.',
      });
      void queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('media:read')) {
    return (
      <>
        <PageHeader title="Media library" />
        <Notice tone="warning" title="No access">
          Your role does not include media:read.
        </Notice>
      </>
    );
  }

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;
  const maxMb = Math.round(UPLOAD.image.maxBytesDefault / (1024 * 1024));

  return (
    <>
      <PageHeader
        title="Media library"
        description={`Public images used across the website. JPG, PNG or WebP, up to ${maxMb} MB.`}
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      <Panel padded={false}>
        <Toolbar>
          <label htmlFor="media-folder" className="kt-visually-hidden">
            Folder
          </label>
          <Select
            id="media-folder"
            value={folder}
            onChange={(event) => {
              setFolder(event.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
          >
            {PUBLIC_MEDIA_FOLDERS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>

          <form
            className={styles.search}
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            <label htmlFor="media-search" className="kt-visually-hidden">
              Search media
            </label>
            <Input
              id="media-search"
              type="search"
              placeholder="Search by file name, alt text or caption"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </form>

          {can('media:create') ? (
            <>
              <label htmlFor="media-upload" className="kt-visually-hidden">
                Upload an image
              </label>
              <input
                id="media-upload"
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ fontSize: 13 }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload.mutate(file);
                }}
              />
              {upload.isPending ? <span className={styles.cellMuted}>Uploading...</span> : null}
            </>
          ) : null}
        </Toolbar>

        <div className={styles.panelBody}>
          {query.isPending ? (
            <Notice tone="info">Loading media...</Notice>
          ) : items.length === 0 ? (
            <EmptyState
              title="Nothing in this folder yet"
              description="Upload an image above, or choose a different folder."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
              }}
            >
              {items.map((asset) => (
                <figure
                  key={asset.id}
                  style={{
                    margin: 0,
                    border: '1px solid var(--kt-border-default)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#fff',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '4 / 3',
                      background: 'var(--kt-surface-muted)',
                    }}
                  >
                    <Image
                      src={asset.variants.card ?? asset.variants.original}
                      alt={asset.altText ?? ''}
                      fill
                      sizes="240px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <figcaption style={{ padding: 12, display: 'grid', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, wordBreak: 'break-word' }}>
                      {asset.originalName}
                    </span>
                    <span className={styles.cellMuted}>
                      {asset.width}&times;{asset.height} &middot;{' '}
                      {Math.round(asset.sizeBytes / 1024)} KB
                    </span>
                    {!asset.altText ? <Badge tone="error">no alt text</Badge> : null}

                    <Field
                      label="Alt text"
                      hint="Describe the image for screen readers and search engines."
                    >
                      {({ id }) => (
                        <Input
                          id={id}
                          value={editing[asset.id] ?? asset.altText ?? ''}
                          disabled={!can('media:update')}
                          onChange={(event) =>
                            setEditing({ ...editing, [asset.id]: event.target.value })
                          }
                        />
                      )}
                    </Field>

                    <div className={styles.inline}>
                      <Button
                        small
                        variant="primary"
                        disabled={
                          !can('media:update') ||
                          editing[asset.id] === undefined ||
                          saveAlt.isPending
                        }
                        onClick={() =>
                          saveAlt.mutate({ id: asset.id, altText: editing[asset.id] ?? '' })
                        }
                      >
                        Save
                      </Button>
                      <Button
                        small
                        variant="danger"
                        disabled={!can('media:delete')}
                        onClick={() => {
                          if (
                            window.confirm(
                              'Archive this image? Pages still using it will show a placeholder.',
                            )
                          ) {
                            archive.mutate(asset.id);
                          }
                        }}
                      >
                        Archive
                      </Button>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>

        {meta ? (
          <Pagination
            page={meta.page}
            pageSize={meta.pageSize}
            total={meta.total}
            totalPages={meta.totalPages}
            onPage={setPage}
          />
        ) : null}
      </Panel>
    </>
  );
}
