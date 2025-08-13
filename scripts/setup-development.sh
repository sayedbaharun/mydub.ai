#!/bin/bash

# Development Environment Setup Script
# This script sets up the complete development environment for MyDub.AI

set -e

echo "🚀 Setting up MyDub.AI Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
check_node_version() {
    echo "📋 Checking Node.js version..."
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "Please install Node.js 18 or higher from https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js version is compatible${NC}"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Set up environment files
setup_env_files() {
    echo "🔐 Setting up environment files..."
    
    # Create .env.local if it doesn't exist
    if [ ! -f .env.local ]; then
        cp .env.example .env.local 2>/dev/null || {
            echo -e "${YELLOW}⚠️  No .env.example found, creating basic .env.local${NC}"
            cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://pltutlpmamxozailzffm.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
VITE_API_URL=http://localhost:3000
VITE_ENABLE_AI_FEATURES=true

# Add your API keys here
VITE_WEATHERAPI_KEY=your_weatherapi_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
VITE_SENTRY_DSN=your_sentry_dsn_here
EOF
        }
        echo -e "${GREEN}✅ Created .env.local${NC}"
        echo -e "${YELLOW}⚠️  Please update .env.local with your API keys${NC}"
    else
        echo -e "${GREEN}✅ .env.local already exists${NC}"
    fi
}

# Set up git hooks
setup_git_hooks() {
    echo "🪝 Setting up git hooks..."
    npx husky install
    
    # Pre-commit hook
    cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged
npx lint-staged

# Run type check
echo "📝 Checking TypeScript..."
npm run type-check

# Check for console.log statements
echo "🔍 Checking for console.log..."
! grep -r "console\.log" src/ --exclude-dir=node_modules || {
    echo "❌ Found console.log statements. Please remove them."
    exit 1
}
EOF
    chmod +x .husky/pre-commit
    
    echo -e "${GREEN}✅ Git hooks configured${NC}"
}

# Set up Supabase CLI
setup_supabase() {
    echo "🗄️ Checking Supabase CLI..."
    if ! command -v supabase &> /dev/null; then
        echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
        echo "Install with: brew install supabase/tap/supabase"
    else
        echo -e "${GREEN}✅ Supabase CLI installed${NC}"
    fi
}

# Create necessary directories
create_directories() {
    echo "📁 Creating necessary directories..."
    mkdir -p src/test/__mocks__
    mkdir -p public/images
    mkdir -p docs/api
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Set up VS Code settings
setup_vscode() {
    echo "💻 Setting up VS Code configuration..."
    mkdir -p .vscode
    
    cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/dist": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
EOF
    
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "christian-kohler.path-intellisense"
  ]
}
EOF
    
    echo -e "${GREEN}✅ VS Code configured${NC}"
}

# Run initial build
run_initial_build() {
    echo "🏗️ Running initial build to check for errors..."
    npm run build || {
        echo -e "${YELLOW}⚠️  Build failed. This might be due to missing environment variables.${NC}"
    }
}

# Final checks
final_checks() {
    echo ""
    echo "🎯 Development Setup Complete!"
    echo ""
    echo "📋 Checklist:"
    
    # Check for required files
    [ -f .env.local ] && echo -e "${GREEN}✅ .env.local exists${NC}" || echo -e "${RED}❌ .env.local missing${NC}"
    [ -f node_modules/.bin/vite ] && echo -e "${GREEN}✅ Dependencies installed${NC}" || echo -e "${RED}❌ Dependencies not installed${NC}"
    [ -d .husky ] && echo -e "${GREEN}✅ Git hooks configured${NC}" || echo -e "${YELLOW}⚠️  Git hooks not configured${NC}"
    
    echo ""
    echo "🚀 Next steps:"
    echo "1. Update .env.local with your API keys"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Visit http://localhost:5173"
    echo ""
    echo "📚 Useful commands:"
    echo "  npm run dev          - Start development server"
    echo "  npm run build        - Build for production"
    echo "  npm run test         - Run tests"
    echo "  npm run lint         - Run linter"
    echo "  npm run type-check   - Check TypeScript"
}

# Main execution
main() {
    check_node_version
    install_dependencies
    setup_env_files
    setup_git_hooks
    setup_supabase
    create_directories
    setup_vscode
    run_initial_build
    final_checks
}

# Run main function
main