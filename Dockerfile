FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Generate prisma client inside the container
RUN npx prisma generate

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
