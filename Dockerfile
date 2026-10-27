# ---- Build: Astro static site ----
# Base images come from mirror.gcr.io (Google's Docker Hub mirror) to avoid anonymous pull limits.
FROM mirror.gcr.io/library/node:26.12.1-alpine AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- Serve: Caddy, non-root, port 8080 ----
FROM mirror.gcr.io/library/caddy:2.11.7-alpine
ENV XDG_CONFIG_HOME=/tmp/caddy/config \
    XDG_DATA_HOME=/tmp/caddy/data \
    PORT=8080
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile \
 && addgroup -S web && adduser -S -G web -H -s /sbin/nologin web \
 && rm -rf /tmp/caddy
USER web
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
