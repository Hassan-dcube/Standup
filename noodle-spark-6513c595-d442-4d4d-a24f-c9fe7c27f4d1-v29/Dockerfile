# Use Node base image
FROM uziiuzair/clandestine-base:latest

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# # Build the app
RUN npm run build

# Expose and start
EXPOSE 4173
CMD ["npm", "start"]