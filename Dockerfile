# ========================================================
# Build stage
# ========================================================
FROM node:22-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@9

ARG VITE_API_URL=http://localhost:3089
ARG VITE_API_PORT=3089
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_PORT=$VITE_API_PORT

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm run build

# ========================================================
# Runtime stage (Nginx)
# ========================================================
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
