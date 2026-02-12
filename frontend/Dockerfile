FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Use 'npm run dev' with --host to expose to network in Docker
CMD ["npm", "run", "dev", "--", "--host"]
