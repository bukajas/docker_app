# Use the official Node.js 18 image based on Alpine Linux
FROM node:18-alpine

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json (and package-lock.json, if available) to the working directory
COPY package*.json ./

# Install dependencies defined in package.json
RUN npm install

# Copy the rest of your application's code into the container
COPY . .

# Command to run your application
CMD ["npm", "run", "dev"]

