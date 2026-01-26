#!/bin/bash

# MCP Setup Script for Modular MCP
# Usage: curl -sSL https://raw.githubusercontent.com/buerokratt/modular-mcp/main/setup.sh | bash -s -- [editor]
# Editors: cursor, vscode, jetbrains, claude, all (default: all)

EDITOR=${1:-all}
BASE_URL="http://localhost:3627/mcp"
INSTRUCTION_CONTENT="When working with the \`modular-mcp\` MCP server, use the \`get_mcp_instructions\` tool to get detailed instructions on how to use this server effectively."

echo "🚀 Setting up Modular MCP (Editor: $EDITOR)..."

# 1. Cursor Setup
if [[ "$EDITOR" == "cursor" || "$EDITOR" == "all" ]]; then
    echo "  Configuring Cursor..."
    mkdir -p .cursor/rules
    cat > .cursor/mcp.json << EOF
{
  "mcpServers": {
    "modular-mcp": {
      "url": "$BASE_URL",
      "transport": {
        "type": "sse"
      }
    }
  }
}
EOF
    cat > .cursor/rules/modular-mcp.mdc << EOF
---
alwaysApply: true
---

# MCP Rules Server Integration

$INSTRUCTION_CONTENT
EOF
fi

# 2. VS Code / GitHub Copilot Setup
if [[ "$EDITOR" == "vscode" || "$EDITOR" == "all" ]]; then
    echo "  Configuring VS Code & GitHub Copilot..."
    mkdir -p .vscode .github
    cat > .vscode/settings.json << EOF
{
  "mcp.servers": {
    "modular-mcp": {
      "url": "$BASE_URL",
      "transport": {
        "type": "sse"
      }
    }
  }
}
EOF
    cat > .github/copilot-instructions.md << EOF
---
applyTo: "**"
---
# MCP Rules Server Integration

$INSTRUCTION_CONTENT
EOF
fi

# 3. JetBrains Setup
if [[ "$EDITOR" == "jetbrains" || "$EDITOR" == "all" ]]; then
    echo "  Configuring JetBrains..."
    mkdir -p .idea .aiassistant/rules
    cat > .idea/mcp.json << EOF
{
  "mcpServers": {
    "modular-mcp": {
      "url": "$BASE_URL",
      "transport": {
        "type": "sse"
      }
    }
  }
}
EOF
    cat > .aiassistant/rules/modular-mcp.md << EOF
# MCP Rules Server Integration

$INSTRUCTION_CONTENT
EOF
    echo "  ⚠️  Note: In JetBrains Settings | Tools | AI Assistant | Project Rules, set 'modular-mcp' to 'Always' mode."
fi

# 4. Claude Code Setup
if [[ "$EDITOR" == "claude" || "$EDITOR" == "all" ]]; then
    echo "  Configuring Claude Code..."
    if command -v claude &> /dev/null; then
        claude mcp add --transport http modular-mcp "$BASE_URL"
        echo "  ✅ Added MCP to Claude Code."
        echo "  Run this to append system prompt: claude --append-system-prompt \"$INSTRUCTION_CONTENT\""
    else
        echo "  ⚠️  'claude' CLI not found. Skipping auto-config, but you can run:"
        echo "  claude mcp add --transport http modular-mcp $BASE_URL"
    fi
fi

echo "✅ Setup complete!"
