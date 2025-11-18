FROM node:22-alpine AS base
WORKDIR /app

# Install deps first for better caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client and build frontend
RUN npx prisma generate
RUN npm run build

# Runtime
EXPOSE 3001
ENV PORT=3001
CMD ["sh", "deploy/start.sh"]