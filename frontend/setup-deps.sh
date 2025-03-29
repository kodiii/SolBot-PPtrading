#!/bin/bash

# Remove existing dependency files
rm -rf node_modules package-lock.json

# Install core dependencies
npm install react@latest \
  react-dom@latest \
  next@latest

# Install types
npm install --save-dev \
  @types/node@latest \
  @types/react@latest \
  @types/react-dom@latest \
  typescript@latest

# Install UI dependencies
npm install @radix-ui/react-slot \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs \
  @radix-ui/react-label \
  class-variance-authority \
  clsx \
  tailwind-merge \
  tailwindcss-animate

# Install chart and data utilities
npm install recharts \
  date-fns \
  swr \
  decimal.js

# Install styling dependencies
npm install tailwindcss \
  postcss \
  autoprefixer \
  next-themes

# Install SQLite and database dependencies
npm install sqlite3 \
  sqlite

# Create next-env.d.ts with proper types
echo 'declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />' > next-env.d.ts

# Initialize Next.js app
npx next telemetry disable

echo "Dependencies installed successfully!"
echo "Run 'npm run dev' to start the development server."