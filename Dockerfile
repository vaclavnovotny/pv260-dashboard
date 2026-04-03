# ── Stage 1: build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /build/frontend
COPY src/frontend/package.json ./
RUN npm install
COPY src/frontend/ ./
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY src/backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY src/backend/ ./

# Copy built frontend into backend/public so Express can serve it
COPY --from=frontend-build /build/frontend/dist ./public

# SQLite database lives on a mounted volume
ENV DB_PATH=/data/data.db

EXPOSE 3001

CMD ["node", "index.js"]
