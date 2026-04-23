ARG NODE_VERSION=20
ARG ALPINE_VERSION=3.19

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} as build

ARG APP_TYPE
ARG NODE_ENV=production
ARG NODE_OPTIONS=--max-old-space-size=4096
ARG PORT

ENV NODE_ENV=${NODE_ENV}
ENV NODE_OPTIONS=${NODE_OPTIONS}

WORKDIR /app

COPY package.json yarn.lock ./
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

RUN apk add --no-cache python3 make g++ && \
    yarn install --frozen-lockfile && \
    apk del python3 make g++

COPY . .

RUN if [ "$APP_TYPE" = "admin" ]; then \
    yarn build:admin; \
    elif [ "$APP_TYPE" = "driver-mobile" ]; then \
    yarn build:driver-mobile; \
    elif [ "$APP_TYPE" = "terminal" ]; then \
    yarn build:terminal; \
    elif [ "$APP_TYPE" = "customer" ] || [ "$APP_TYPE" = "web" ]; then \
    yarn build:customer 2>/dev/null || yarn build:web || echo "No build script found"; \
    else \
    echo "Invalid APP_TYPE: $APP_TYPE" && exit 1; \
    fi

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} as runtime

ARG APP_TYPE
ARG PORT

ENV NODE_ENV=production
ENV PORT=${PORT}

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/package.json ./
COPY --from=build --chown=nextjs:nodejs /app/.yarn ./.yarn
COPY --from=build --chown=nextjs:nodejs /app/.yarnrc.yml ./

COPY --from=build --chown=nextjs:nodejs /app/apps/compass-${APP_TYPE}/.next ./apps/compass-${APP_TYPE}/.next
COPY --from=build --chown=nextjs:nodejs /app/apps/compass-${APP_TYPE}/public ./apps/compass-${APP_TYPE}/public
COPY --from=build --chown=nextjs:nodejs /app/apps/compass-${APP_TYPE}/next.config.mjs ./apps/compass-${APP_TYPE}/
COPY --from=build --chown=nextjs:nodejs /app/apps/compass-${APP_TYPE}/package.json ./apps/compass-${APP_TYPE}/

USER nextjs

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT}', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD if [ "$APP_TYPE" = "admin" ]; then \
    yarn start:admin; \
    elif [ "$APP_TYPE" = "driver-mobile" ]; then \
    yarn start:driver-mobile; \
    elif [ "$APP_TYPE" = "terminal" ]; then \
    yarn start:terminal; \
    elif [ "$APP_TYPE" = "customer" ] || [ "$APP_TYPE" = "web" ]; then \
    yarn start:customer 2>/dev/null || yarn start:web || node apps/compass-${APP_TYPE}/server.js; \
    fi
