FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better Docker caching)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
