#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Build the site manually and check for errors

# Navigate to the _site directory
cd _site || exit

# Initialize a new Git repository if it doesn't exist
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/ICE-5/ice-5.github.io.git
    echo -e "${GREEN} Initialized git repository and added remote origin. ${NC}"
fi

# Check out the gh-pages branch
if [ "$(git branch --show-current)" != "gh-pages" ]; then
    git checkout -b gh-pages
    echo -e "${GREEN} Switched to gh-pages branch. ${NC}"
fi

# Add all files and commit
git add .

# Prompt for commit message
echo -e "${YELLOW} Enter a commit message: ${NC} "
read -r commit_msg

# Use a default message if none is entered
if [ -z "$commit_msg" ]; then
    commit_msg="Site updated: $(date)"
fi

# Commit changes
git commit -m "$commit_msg"

# Push to gh-pages branch
git push --force origin gh-pages
echo -e "${GREEN} Site pushed to gh-pages branch. ${NC}"

# Complete
echo -e "${GREEN} Deployment complete! ${NC}"
cd ..