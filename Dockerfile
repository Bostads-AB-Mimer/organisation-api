# ---- Base Node ----
FROM node as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm ci

# Copy app source
COPY . .

# Build the app
RUN npm run build

# ---- Production Node ----
FROM node:slim

ENV NODE_ENV production
USER node

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm ci --only=production

# Copy built app files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the listening port
EXPOSE 5000
CMD [ "node", "dist/index.js" ]
