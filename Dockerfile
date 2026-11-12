FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
COPY --from=build /app/build ./
RUN npm ci --omit=dev && npm cache clean --force
EXPOSE 8080
CMD ["node", "bin/server.js"]
