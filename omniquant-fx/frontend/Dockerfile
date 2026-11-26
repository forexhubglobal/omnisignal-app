FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
ARG BACKEND_INTERNAL_URL=http://backend:8005
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}
ENV NEXT_PUBLIC_API_URL=http://localhost:8005
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3005
CMD ["npm", "run", "start"]
