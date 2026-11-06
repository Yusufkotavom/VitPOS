# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/desktop/package.json apps/desktop/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/shared-contracts/package.json packages/shared-contracts/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
# Uploaded images are written here; mount a volume over /app/uploads so they
# survive redeploys (see Dokploy mount "vitpos-uploads").
ENV UPLOAD_DIR=/app/uploads
COPY --from=build /app /app
RUN mkdir -p /app/uploads
EXPOSE 3000
CMD ["node", "serve.mjs"]
