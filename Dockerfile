# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the remaining project files to the working directory
COPY . .

# Expose a port (if your Node.js application listens on a specific port)
EXPOSE 3000

# Define the command to run your Node.js application
CMD [ "node", "app.js", "0.0.0.0" ]
