FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Rules directory will be volume-mounted, so we don't copy it
# This allows changes to reflect immediately after git pull

# Expose port (if needed in the future)
# EXPOSE 3000

# Run the MCP server
CMD ["bun", "run", "src/server.ts"]

