# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build args for Supabase (must be provided at build time)
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY

# Verify args exist (optional debug, prints to build logs)
RUN echo "Building with Supabase URL: ${SUPABASE_URL}"

# Build the app explicitly passing environment variables
RUN SUPABASE_URL=$SUPABASE_URL SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY npm run build

# Stage 2: Serve the application
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
