FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10.18.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# ---- Dependencies ----
FROM base AS dependencies
RUN pnpm install --frozen-lockfile

# ---- Build stage (if needed) ----
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# ---- Production image ----
FROM base AS production

# Install PM2 globally (optional, but recommended)
RUN npm install -g pm2@7.0.3

# Copy built application
COPY --from=builder /app /app

# Create directories for logs and storage (if not present)
RUN mkdir -p /app/logs /app/storage

# Expose the port your app listens on
EXPOSE 3200

# Use PM2 as entrypoint
CMD ["pm2-runtime", "start", "ecosystem.config.cjs", "--env", "production"]