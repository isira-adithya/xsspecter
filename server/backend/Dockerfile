# Base stage for both development and production
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

# Development stage
FROM base AS development
RUN npm install
COPY . .
RUN npm run generate
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
RUN npm install
COPY . .
CMD ["npm", "run", "start"]