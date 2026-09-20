# =============================================================================
# Key Tech Solutions API - production image
#
# Multi-stage: dependencies, build, then a slim runtime that carries only the
# compiled output and production dependencies. No secret is ever baked in;
# every credential arrives as an environment variable at run time.
# =============================================================================

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---- dependencies -----------------------------------------------------------
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

# ---- build ------------------------------------------------------------------
FROM deps AS build
COPY tsconfig.base.json ./
COPY prisma ./prisma
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter "./packages/*" -r --workspace-concurrency=1 build \
 && pnpm exec prisma generate --schema prisma/schema.prisma \
 && pnpm --filter @kts/api build \
 && pnpm --filter @kts/api --prod deploy /out

# ---- runtime ----------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Run unprivileged. The uploads directory is the only writable path.
RUN groupadd --system --gid 1001 kts \
 && useradd --system --uid 1001 --gid kts kts \
 && mkdir -p /app/uploads/public /app/uploads/private /app/uploads/temp \
 && chown -R kts:kts /app

COPY --from=build --chown=kts:kts /out/node_modules ./node_modules
COPY --from=build --chown=kts:kts /out/dist ./dist
COPY --from=build --chown=kts:kts /out/package.json ./package.json
COPY --from=build --chown=kts:kts /app/prisma ./prisma

USER kts
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Migrations are deliberately NOT run here. Apply them explicitly with
#   pnpm prisma:migrate:deploy
# so a container restart can never mutate a production schema by surprise.
CMD ["node", "dist/main.js"]
