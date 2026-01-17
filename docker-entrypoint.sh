#!/bin/sh
set -e

echo "🚀 Liteda starting..."
echo ""

# Config directory
CONFIG_DIR="${CONFIG_DIR:-/app/config}"

# Check if config directory exists
if [ ! -d "$CONFIG_DIR" ]; then
    echo "❌ Error: Config directory not found: $CONFIG_DIR"
    echo "   Please mount a volume to $CONFIG_DIR"
    exit 1
fi

# Check if config directory is writable
CONFIG_WRITABLE=true
if [ ! -w "$CONFIG_DIR" ]; then
    CONFIG_WRITABLE=false
    echo "⚠️  Warning: Config directory is not writable: $CONFIG_DIR"
    echo "   You may not be able to edit config files from the host"
    echo ""
fi

# Initialize config if not exists
if [ ! -f "$CONFIG_DIR/settings.yaml" ]; then
    echo "📋 Initializing default configuration..."
    
    # Create directories
    mkdir -p "$CONFIG_DIR/pages" "$CONFIG_DIR/schemas" 2>/dev/null || true
    
    # Copy example config
    if [ -d "/app/config-example" ]; then
        cp -r /app/config-example/* "$CONFIG_DIR/" 2>/dev/null || {
            echo "⚠️  Warning: Could not copy config files (permission issue?)"
            if [ "$CONFIG_WRITABLE" = "false" ]; then
                echo ""
                echo "🔧 To fix permission issues, run on your host:"
                echo "   sudo chown -R \$(id -u):\$(id -g) config/"
                echo ""
                echo "Or add to docker-compose.yml:"
                echo "   user: \"\${UID:-1000}:\${GID:-1000}\""
                echo ""
            fi
            exit 1
        }
        echo "✅ Default config created at: $CONFIG_DIR"
    else
        echo "❌ Error: Example config not found at /app/config-example"
        exit 1
    fi
else
    echo "✅ Using existing config at: $CONFIG_DIR"
fi

# Validate required config files
echo ""
echo "📊 Configuration status:"

if [ -f "$CONFIG_DIR/settings.yaml" ]; then
    echo "   Settings: ✅ $CONFIG_DIR/settings.yaml"
else
    echo "   Settings: ❌ Not found"
    exit 1
fi

if [ -f "$CONFIG_DIR/services.yaml" ]; then
    echo "   Services: ✅ $CONFIG_DIR/services.yaml"
else
    echo "   Services: ⚠️  Not found (will create empty)"
    echo "[]" > "$CONFIG_DIR/services.yaml" 2>/dev/null || true
fi

# Count services and widgets
if [ -f "$CONFIG_DIR/services.yaml" ]; then
    SERVICE_COUNT=$(grep -c "^  - name:" "$CONFIG_DIR/services.yaml" 2>/dev/null || echo "0")
    WIDGET_COUNT=$(grep -c "widget:" "$CONFIG_DIR/services.yaml" 2>/dev/null || echo "0")
    
    echo ""
    echo "📦 Services configured: $SERVICE_COUNT"
    echo "🧩 Widgets configured: $WIDGET_COUNT"
fi

# Display runtime info
echo ""
echo "⚙️  Runtime configuration:"
echo "   Port: ${PORT:-3000}"
echo "   Auto reload: ${AUTO_RELOAD:-false}"
echo "   Node env: ${NODE_ENV:-production}"

echo ""
echo "🌐 Server will be available at:"
echo "   http://localhost:${PORT:-3000}"
echo ""
echo "📖 Documentation: https://github.com/your-repo/liteda"
echo "🐛 Issues: https://github.com/your-repo/liteda/issues"
echo ""

# Permission reminder
if [ "$CONFIG_WRITABLE" = "false" ]; then
    echo "💡 Tip: If you can't edit config files, see troubleshooting:"
    echo "   https://github.com/your-repo/liteda#permission-denied"
    echo ""
fi

# Start the application
exec "$@"
