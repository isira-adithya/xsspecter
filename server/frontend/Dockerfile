# Build stage
FROM node:22-alpine AS build
WORKDIR /app/

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code and build
COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:1.27 AS production
# Copy the built files from the build stage to Nginx's serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: copy custom nginx configuration if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80