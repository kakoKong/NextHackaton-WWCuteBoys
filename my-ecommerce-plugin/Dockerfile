# Install dependencies
FROM node:18-alpine as builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Production image
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
