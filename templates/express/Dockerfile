# Foundathyon Deploy - Node.js / Express
# PORT TO SET IN THE PANEL: 3000
# Your app must listen on process.env.PORT and on host 0.0.0.0 (not "localhost").
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node . .
USER node
EXPOSE 3000
# Change "server.js" if your entry point has another name.
CMD ["node", "server.js"]
