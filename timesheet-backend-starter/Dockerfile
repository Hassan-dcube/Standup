FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile;     elif [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile;     else npm ci; fi
COPY . .
RUN npm run build || pnpm run build || true
EXPOSE 4000
CMD [ "node", "dist/server.js" ]
