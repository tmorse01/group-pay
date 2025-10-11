#!/bin/bash

# Azure App Service startup script for Group Pay API
# This script runs when the container starts

echo "🚀 Starting Group Pay API..."

# Change to the app directory
cd /home/site/wwwroot

# Check if we're in development mode
if [ "$NODE_ENV" = "development" ]; then
    echo "📋 Running in development mode"
else 
    echo "📋 Running in production mode"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Generate Prisma Client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Optional: Seed database if it's empty (uncomment if needed)
# echo "🌱 Checking if database needs seeding..."
# npx tsx prisma/seed.ts

echo "✅ Setup complete. Starting application..."

# Start the application
exec node dist/index.js