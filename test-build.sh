docker build -t api-debug -f apps/api/Dockerfile --target builder .
docker run --rm api-debug sh -c "cd /app/deploy && pnpm dlx prisma generate --schema=node_modules/@repo/db/prisma/schema.prisma"
