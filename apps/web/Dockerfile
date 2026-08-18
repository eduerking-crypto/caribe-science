# CARIBE SCIENCE Frontend — Secure Multi-stage Dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Build application
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runtime

# Security: Run as non-root user
RUN addgroup -g 1001 -S caribe && \
    adduser -S caribe -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=caribe:caribe /app/.next/standalone ./
COPY --from=builder --chown=caribe:caribe /app/.next/static ./.next/static
COPY --from=builder --chown=caribe:caribe /app/public ./public

# Switch to non-root user
USER caribe

EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
