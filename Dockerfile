FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat

ARG NODE_ENV=production

COPY package.json package-lock.json* ./
RUN if [ "$NODE_ENV" = "production" ]; then npm ci --omit=dev; else npm ci; fi

COPY dist ./dist

EXPOSE 4000
CMD ["node", "dist/server.js"]
