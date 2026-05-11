#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "Installing npm dependencies..."
npm install

echo "Cleaning up Cypress reports directory..."
rm -rf cypress/reports || true
echo "Cleaning up Cypress videos directory..."
rm -rf cypress/videos || true

echo "Running Cypress tests via CLI..."
npm run cy-testCLI
