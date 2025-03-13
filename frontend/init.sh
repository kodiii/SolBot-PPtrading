#!/bin/bash

# Remove existing node_modules and lock files
rm -rf node_modules package-lock.json .next

# Install dependencies
npm install react@latest \
  react-dom@latest \
  next@latest \
  @types/node@latest \
  @types/react@latest \
  @types/react-dom@latest \
  typescript@latest \
  tailwindcss@latest \
  postcss@latest \
  autoprefixer@latest \
  @radix-ui/react-slot \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs \
  @radix-ui/react-label \
  class-variance-authority \
  clsx \
  tailwind-merge \
  recharts \
  swr \
  decimal.js \
  date-fns \
  lucide-react \
  next-themes \
  tailwindcss-animate

# Create next-env.d.ts
echo 'declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />' > next-env.d.ts

# Initialize Next.js app
npx next telemetry disable
npm run dev