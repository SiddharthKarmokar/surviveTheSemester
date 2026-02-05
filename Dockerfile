FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app /app
USER nodejs

EXPOSE 8080
CMD ["node", "server.js"]
