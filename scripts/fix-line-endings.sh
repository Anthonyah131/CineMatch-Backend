#!/bin/bash

# Script to convert all TypeScript files to LF line endings

echo "Converting all TypeScript files to LF line endings..."

# Find all .ts files and convert line endings
find src -name "*.ts" -type f -exec dos2unix {} \;

echo "Conversion complete!"
echo "Running prettier to format all files..."

# Run prettier on all files
npm run format

echo "All files processed!"
