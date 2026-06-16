# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json nest-cli.json ./
COPY knowledge_base.json ./
COPY src ./src

RUN yarn build

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY knowledge_base.json ./

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
