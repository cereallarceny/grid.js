FROM node:lts as builder

RUN mkdir /build /dist && chmod 0777 /build /dist

USER node

WORKDIR /build
COPY package*.json ./
RUN npm install && \
    npm cache rm --force && rm -rf ~/.npm && rm -rf /tmp/npm*

COPY . .
RUN npm run build \
    && npm prune --production \
    && npm cache rm --force && rm -rf ~/.npm && rm -rf /tmp/npm*

# Move dist files to final build folder
WORKDIR /dist
RUN mv /build/package.json ./ \
    && mv /build/dist ./ \
    && mv /build/node_modules ./

# Release image
FROM node:lts-slim as release

ARG PORT=3000
ENV PORT=$PORT
EXPOSE $PORT

WORKDIR /app

COPY --from=builder /dist ./

USER node

ENTRYPOINT ["node", "./dist/index.js"]
