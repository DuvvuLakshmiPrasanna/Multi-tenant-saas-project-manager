FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN apk add --no-cache curl

COPY . .

EXPOSE 5000

# Use startup script to run migrations
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
