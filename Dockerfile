# ====================================================================
# UNFAZED PRACTICE MANAGEMENT — MULTI-STAGE PRODUCTION DOCKERFILE
# Single-Port Unified Architecture: Port 5000
# ====================================================================

# Step 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY unfazed-frontend/package*.json ./
RUN npm install

COPY unfazed-frontend/ ./
RUN npm run build

# Step 2: Production Backend Server & Static Host
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies for backend
COPY unfazed-backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source
COPY unfazed-backend/ ./backend/

# Copy compiled frontend dist bundle into backend public directory
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Ensure uploads directory structure exists
RUN mkdir -p ./backend/uploads/invoices ./backend/uploads/backups

EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "server.js"]
