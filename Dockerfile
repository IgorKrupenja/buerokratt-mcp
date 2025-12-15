FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY src ./src
COPY tsconfig.json ./

# Rules directory will be volume-mounted, so we don't copy it
# This allows changes to reflect immediately after git pull or on rule edit

EXPOSE 3627

CMD ["bun", "run", "src/server.ts"]

