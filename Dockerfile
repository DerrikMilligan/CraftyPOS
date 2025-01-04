# Use a Node.js 18 base image
FROM node:18-bullseye AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxss1 \
    libgtk-3-0 \
    libxshmfence1 \
    libglu1 \
    && rm -rf /var/lib/apt/lists/*

# Install PNPM
RUN npm install -g pnpm@8

# Copy project files
COPY package.json pnpm-lock.yaml ./
COPY . .

# Install dependencies with PNPM
RUN pnpm install --frozen-lockfile

# Build the project
RUN pnpm run build

# Production stage
FROM node:18-bullseye AS production

# Set working directory
WORKDIR /app

# Copy necessary files from the build stage
COPY --from=base /app .

# Install PNPM
RUN npm install -g pnpm@8

# Install only production dependencies
RUN pnpm prune --prod

# Expose the application port
EXPOSE 3000

# Set the default command
CMD ["pnpm", "run", "start"]

