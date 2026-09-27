# =============================================================================
# Key Tech Solutions public website - production image
#
# Uses the Next.js standalone output, so the runtime layer contains only the
# server and the assets it needs. NEXT_PUBLIC_* values are build arguments
# because they are inlined into the browser bundle; no secret belongs here.
# =============================================================================

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/config/package.json            packages/config/
COPY packages/shared-types/package.json      packages/shared-types/
COPY packages/validation/package.json        packages/validation/
COPY packages/seo/package.json               packages/seo/
COPY packages/api-client/package.json        packages/api-client/
COPY packages/email-templates/package.json   packages/email-templates/
COPY packages/ui/package.json                packages/ui/
COPY packages/admin-ui/package.json          packages/admin-ui/
COPY apps/api/package.json                   apps/api/
COPY apps/public-web/package.json            apps/public-web/
COPY apps/admin-web/package.json             apps/admin-web/
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3010
ARG NEXT_PUBLIC_SITE_NAME="Key Tech Solutions"
ARG NEXT_PUBLIC_API_URL=http://localhost:4010
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
# Produces .next/standalone, which the runtime stage copies.
ENV NEXT_OUTPUT_STANDALONE=1
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/public-web ./apps/public-web
RUN pnpm --filter "./packages/*" -r --workspace-concurrency=1 build \
 && pnpm --filter @kts/public-web build

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/apps/public-web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/public-web/.next/static ./apps/public-web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/public-web/public ./apps/public-web/public

USER nextjs
EXPOSE 3010
ENV PORT=3010
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3010/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/public-web/server.js"]
