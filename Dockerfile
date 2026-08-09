FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY config ./config
COPY scripts ./scripts
COPY .env.example ./

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
