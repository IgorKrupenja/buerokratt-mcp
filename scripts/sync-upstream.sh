#!/bin/bash

# This script syncs a fork with the upstream repository
# It automatically detects the repository name and syncs with buerokratt upstream
# It fetches from upstream, merges upstream/dev into local dev branch,
# and pushes to origin/dev by default
#
# Usage:
#   ./sync-upstream.sh [target-directory] [no-push]
#   If target-directory is not provided, uses current directory

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
UPSTREAM_ORG="buerokratt"
TARGET_BRANCH="dev"

# Parse arguments
TARGET_DIR="${1}"
SKIP_PUSH="false"

# Check if first arg is "no-push"
if [ "$1" = "no-push" ]; then
    TARGET_DIR=""
    SKIP_PUSH="no-push"
elif [ "$2" = "no-push" ]; then
    SKIP_PUSH="no-push"
fi

# If target directory is provided, change to it
if [ -n "$TARGET_DIR" ]; then
    if [ ! -d "$TARGET_DIR" ]; then
        echo -e "${RED}Error: Directory ${TARGET_DIR} does not exist${NC}"
        exit 1
    fi
    cd "$TARGET_DIR"
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Detect repository name from current directory
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
UPSTREAM_REPO="https://github.com/${UPSTREAM_ORG}/${REPO_NAME}.git"

echo -e "${GREEN}Starting upstream sync for ${YELLOW}${REPO_NAME}${NC}..."
echo -e "Upstream: ${YELLOW}${UPSTREAM_REPO}${NC}"

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "Current branch: ${YELLOW}${CURRENT_BRANCH}${NC}"

# Check if upstream remote exists, add it if not
if ! git remote | grep -q "^upstream$"; then
    echo -e "${YELLOW}Upstream remote not found. Adding upstream remote...${NC}"
    git remote add upstream "$UPSTREAM_REPO"
    echo -e "${GREEN}Upstream remote added${NC}"
else
    # Verify upstream URL is correct
    CURRENT_UPSTREAM_URL=$(git remote get-url upstream)
    if [ "$CURRENT_UPSTREAM_URL" != "$UPSTREAM_REPO" ]; then
        echo -e "${YELLOW}Updating upstream remote URL...${NC}"
        git remote set-url upstream "$UPSTREAM_REPO"
        echo -e "${GREEN}Upstream remote URL updated${NC}"
    else
        echo -e "${GREEN}Upstream remote found${NC}"
    fi
fi

# Fetch from upstream
echo -e "${GREEN}Fetching from upstream...${NC}"
git fetch upstream

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Uncommitted changes detected. Stashing...${NC}"
    git stash push -m "Auto-stash before syncing with upstream"
    STASHED=true
else
    STASHED=false
fi

# Switch to target branch
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo -e "Switching to ${YELLOW}${TARGET_BRANCH}${NC} branch..."
    git checkout "$TARGET_BRANCH"
fi

# Merge upstream/dev into local dev
echo -e "${GREEN}Merging upstream/${TARGET_BRANCH} into local ${TARGET_BRANCH}...${NC}"
if git merge upstream/"$TARGET_BRANCH"; then
    echo -e "${GREEN}Successfully merged upstream/${TARGET_BRANCH}${NC}"
else
    echo -e "${RED}Merge failed. Please resolve conflicts manually.${NC}"
    # Restore stash if we stashed
    if [ "$STASHED" = true ]; then
        echo -e "${YELLOW}Restoring stashed changes...${NC}"
        git stash pop || true
    fi
    exit 1
fi

# Restore stashed changes if any
if [ "$STASHED" = true ]; then
    echo -e "${GREEN}Restoring stashed changes...${NC}"
    git stash pop || echo -e "${YELLOW}Note: Some stashed changes may have conflicts${NC}"
fi

# Push to origin by default (unless no-push is specified)
if [ "$SKIP_PUSH" != "no-push" ]; then
    echo -e "${GREEN}Pushing to origin/${TARGET_BRANCH}...${NC}"
    git push origin "$TARGET_BRANCH"
    echo -e "${GREEN}Successfully pushed to origin/${TARGET_BRANCH}${NC}"
else
    echo -e "${YELLOW}Skipping push to origin/${TARGET_BRANCH}${NC}"
    echo -e "${YELLOW}To push manually, run: git push origin ${TARGET_BRANCH}${NC}"
fi

# Switch back to original branch if it was different
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo -e "Switching back to ${YELLOW}${CURRENT_BRANCH}${NC} branch..."
    git checkout "$CURRENT_BRANCH"
fi

echo -e "${GREEN}Upstream sync completed successfully!${NC}"


