FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN --mount=type=secret,id=VITE_SUPABASE_URL \
  --mount=type=secret,id=VITE_SUPABASE_ANON_KEY \
  VITE_SUPABASE_URL=$(cat /run/secrets/VITE_SUPABASE_URL) \
  VITE_SUPABASE_ANON_KEY=$(cat /run/secrets/VITE_SUPABASE_ANON_KEY) \
  npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.output ./.output
COPY --from=build /app/public ./public
EXPOSE 5000
CMD ["node", ".output/server/index.mjs"]
