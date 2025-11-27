# Simple API-only build for Render/Fly/Railway
# Frontend remains on Netlify; this container only serves /api/*

FROM node:20-alpine as base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Build API bundle
COPY tsconfig.json tsconfig.*.json* ./ 2>/dev/null || true
COPY server ./server
COPY shared ./shared
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Runtime image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 5000
CMD ["node", "dist/index.js"]
