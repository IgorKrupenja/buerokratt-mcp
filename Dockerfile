FROM node:24.12-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable pnpm \
    && corepack install \
    && pnpm install --frozen-lockfile --prod

COPY src ./src
COPY tsconfig.json ./

# Rules directory will be volume-mounted, so we don't copy it
# This allows changes to reflect immediately after git pull or on rule edit

EXPOSE 3627

CMD ["pnpm", "exec", "tsx", "src/server.ts"]

