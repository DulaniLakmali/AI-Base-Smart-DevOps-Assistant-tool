# Production Dockerfile for Smart DevOps Assistant Backend
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY tests ./tests
COPY devops_assistant.sqlite ./devops_assistant.sqlite

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "src/index.js"]
