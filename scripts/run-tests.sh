#!/bin/bash

# MyDub.AI Comprehensive Test Runner
# This script runs all E2E tests with various configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
RUN_ALL=false
RUN_E2E=false
RUN_PERFORMANCE=false
RUN_ACCESSIBILITY=false
RUN_VISUAL=false
BROWSER="chromium"
HEADED=false
DEBUG=false
REPORT=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      RUN_ALL=true
      shift
      ;;
    --e2e)
      RUN_E2E=true
      shift
      ;;
    --performance)
      RUN_PERFORMANCE=true
      shift
      ;;
    --accessibility)
      RUN_ACCESSIBILITY=true
      shift
      ;;
    --visual)
      RUN_VISUAL=true
      shift
      ;;
    --browser)
      BROWSER="$2"
      shift 2
      ;;
    --headed)
      HEADED=true
      shift
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
    --report)
      REPORT=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --all              Run all test suites"
      echo "  --e2e              Run E2E tests"
      echo "  --performance      Run performance tests"
      echo "  --accessibility    Run accessibility tests"
      echo "  --visual           Run visual regression tests"
      echo "  --browser <name>   Browser to use (chromium, firefox, webkit)"
      echo "  --headed           Run tests in headed mode"
      echo "  --debug            Run tests in debug mode"
      echo "  --report           Generate and open HTML report"
      echo "  --help             Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# If no specific tests selected, run all
if [ "$RUN_ALL" = true ] || ([ "$RUN_E2E" = false ] && [ "$RUN_PERFORMANCE" = false ] && [ "$RUN_ACCESSIBILITY" = false ] && [ "$RUN_VISUAL" = false ]); then
  RUN_ALL=true
  RUN_E2E=true
  RUN_PERFORMANCE=true
  RUN_ACCESSIBILITY=true
  RUN_VISUAL=true
fi

# Function to run tests
run_tests() {
  local test_type=$1
  local test_path=$2
  local extra_args=$3
  
  echo -e "${YELLOW}Running $test_type tests...${NC}"
  
  if [ "$HEADED" = true ]; then
    extra_args="$extra_args --headed"
  fi
  
  if [ "$DEBUG" = true ]; then
    extra_args="$extra_args --debug"
  fi
  
  if npx playwright test --project="$BROWSER" $test_path $extra_args; then
    echo -e "${GREEN}✓ $test_type tests passed${NC}"
    return 0
  else
    echo -e "${RED}✗ $test_type tests failed${NC}"
    return 1
  fi
}

# Ensure dependencies are installed
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm ci
fi

# Install Playwright browsers if needed
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
  echo "Installing Playwright browsers..."
  npx playwright install
fi

# Clean previous test results
echo -e "${YELLOW}Cleaning previous test results...${NC}"
rm -rf test-results playwright-report

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Start the dev server in background
echo -e "${YELLOW}Starting development server...${NC}"
npm run preview &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to be ready..."
sleep 5

# Track test results
FAILED_TESTS=0

# Run E2E tests
if [ "$RUN_E2E" = true ]; then
  if ! run_tests "E2E" "tests/e2e/user-journey.spec.ts tests/e2e/auth-flows.spec.ts tests/e2e/admin-workflows.spec.ts"; then
    ((FAILED_TESTS++))
  fi
fi

# Run Performance tests
if [ "$RUN_PERFORMANCE" = true ]; then
  if ! run_tests "Performance" "tests/performance/" "--project=performance"; then
    ((FAILED_TESTS++))
  fi
fi

# Run Accessibility tests
if [ "$RUN_ACCESSIBILITY" = true ]; then
  if ! run_tests "Accessibility" "tests/e2e/accessibility.spec.ts" "--project=accessibility"; then
    ((FAILED_TESTS++))
  fi
fi

# Run Visual Regression tests
if [ "$RUN_VISUAL" = true ]; then
  if ! run_tests "Visual Regression" "tests/e2e/visual.spec.ts"; then
    ((FAILED_TESTS++))
  fi
fi

# Kill the dev server
echo -e "${YELLOW}Stopping development server...${NC}"
kill $SERVER_PID 2>/dev/null || true

# Generate report
if [ "$REPORT" = true ] || [ $FAILED_TESTS -gt 0 ]; then
  echo -e "${YELLOW}Generating test report...${NC}"
  npx playwright show-report
fi

# Summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}$FAILED_TESTS test suite(s) failed${NC}"
  exit 1
fi