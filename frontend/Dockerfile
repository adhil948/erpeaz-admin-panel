# frontend/Dockerfile
# 1) build stage
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2) runtime stage - nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# copy a custom nginx config to proxy /api to the backend container
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
