# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Dependencias + compilación
FROM base AS build
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Solo dependencias de producción
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Imagen final, liviana y sin root
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
