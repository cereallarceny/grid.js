FROM node:lts as builder

WORKDIR /build
COPY package*.json ./
RUN npm config set unsafe-perm true && npm install \
    && npm cache rm --force && rm -rf ~/.npm && rm -rf /tmp/npm*

COPY . .
RUN npm run build \
    && npm prune --production \
    && npm cache rm --force && rm -rf ~/.npm && rm -rf /tmp/npm*

# Move dist files to final dist folder
RUN mkdir /dist && mv package.json dist node_modules /dist

# Release image
FROM node:lts-slim as release

ARG PORT=3000
ENV PORT=$PORT
EXPOSE $PORT

WORKDIR /app
COPY --from=builder /dist/ ./
USER node

ENTRYPOINT ["node", "./dist/index.js"]
