FROM node:20-alpine3.19 as build
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096
WORKDIR /app
COPY . .
RUN sh -c "yarn install"
RUN sh -c "yarn build:driver-mobile"
EXPOSE 3028
CMD ["sh", "-c", "yarn start:driver-mobile"]
