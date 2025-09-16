# backend/Dockerfile
FROM node:20-bullseye-slim

WORKDIR /app

# Install minimal build tools needed for native modules (e.g. bcrypt)
RUN apt-get update && apt-get install -y python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy package files and install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Use your start script (change if your entry point is different)
CMD ["npm", "start"]
