FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

COPY src ./src
COPY tsconfig.json ./

# Rules directory will be volume-mounted, so we don't copy it
# This allows changes to reflect immediately after git pull or on rule edit

EXPOSE 3627

CMD ["npx", "tsx", "src/server.ts"]

