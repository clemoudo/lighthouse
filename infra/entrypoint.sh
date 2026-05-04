#!/bin/bash
set -e

# Configuration Infisical API URL if not set
export INFISICAL_API_URL="${INFISICAL_API_URL:-https://eu.infisical.com/}"

# Determine Infisical environment
INFISICAL_ENV="dev"
if [ "$NODE_ENV" = "production" ]; then
    INFISICAL_ENV="prod"
elif [ "$NODE_ENV" = "staging" ]; then
    INFISICAL_ENV="staging"
fi

echo "🔐 Infisical: Authentication check (Environment: $INFISICAL_ENV)..."

# If Client ID and Secret are provided, we login to get a fresh token
if [ -n "$INFISICAL_CLIENT_ID" ] && [ -n "$INFISICAL_CLIENT_SECRET" ]; then
    echo "🔑 Logging in with Machine Identity..."

    # We temporarily disable set -e for the command that might fail
    set +e
    LOGIN_OUTPUT=$(infisical login --method=universal-auth \
        --client-id="$INFISICAL_CLIENT_ID" \
        --client-secret="$INFISICAL_CLIENT_SECRET" \
        --silent --plain 2>&1)
    EXIT_CODE=$?
    set -e

    if [ $EXIT_CODE -eq 0 ] && [ -n "$LOGIN_OUTPUT" ]; then
        export INFISICAL_TOKEN=$LOGIN_OUTPUT
        echo "✅ Successfully authenticated with Infisical."
    else
        echo "❌ Infisical authentication failed (Exit Code: $EXIT_CODE):"
        echo "$LOGIN_OUTPUT"
        exit 1
    fi
elif [ -n "$INFISICAL_TOKEN" ]; then
    echo "🎫 Using provided INFISICAL_TOKEN."
else
    echo "⚠️ No Infisical credentials found (INFISICAL_CLIENT_ID/SECRET or INFISICAL_TOKEN). Proceeding without Infisical run."
fi

# Export secrets to .env for better compatibility with Node.js and Prisma
if [ -n "$INFISICAL_TOKEN" ] && [ -n "$INFISICAL_PROJECT_ID" ]; then
    echo "📝 Exporting Infisical secrets to .env..."
    infisical export \
        --token="$INFISICAL_TOKEN" \
        --projectId="$INFISICAL_PROJECT_ID" \
        --env="$INFISICAL_ENV" \
        --domain="$INFISICAL_API_URL" \
        --format=dotenv > .env

    # Source variables into the current shell process so child processes inherit them
    set -a
    source .env
    set +a

    echo "✅ .env generated and variables loaded into environment."
fi

echo "🚀 Starting application..."
exec "$@"

