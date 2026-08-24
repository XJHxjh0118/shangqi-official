# ---- build ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

# 部署环境统一使用 MySQL（本地仍可继续用 SQLite）
RUN sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma

RUN npm ci

COPY . .
# 再次确保 COPY 覆盖后仍是 mysql
RUN sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma \
  && npx prisma generate \
  && npm run build

# ---- runtime ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV UPLOAD_DIR=uploads

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma \
  && npm ci --omit=dev \
  && npm install prisma@6.19.0 --no-save \
  && npx prisma generate \
  && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
  && mkdir -p uploads

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
