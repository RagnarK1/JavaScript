FROM node:latest as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:latest
WORKDIR /app
EXPOSE 3000
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
CMD ["npm", "start"]
#CMD ["npm", "run", "dev", "--experimental-https"]
