FROM node:20-bookworm-slim AS build
WORKDIR /opt/app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3 libvips-dev \
  && rm -rf /var/lib/apt/lists/*
COPY cms/package.json cms/package-lock.json ./
RUN npm ci
COPY cms/ ./
ENV NODE_ENV=production
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /opt/app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends libvips42 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /opt/app ./
RUN mkdir -p public/uploads
EXPOSE 1337
CMD ["npm", "run", "start"]
