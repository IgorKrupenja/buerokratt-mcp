FROM oven/bun:1.3.4

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile --production

COPY src ./src
COPY tsconfig.json ./

# Rules directory will be volume-mounted, so we don't copy it
# This allows changes to reflect immediately after git pull or on rule edit

EXPOSE 3627

CMD ["bun", "run", "src/server.ts"]

