FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build for production
RUN npm run build

# Use a lightweight web server for the static files
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Add nginx config to route everything to index.html (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
