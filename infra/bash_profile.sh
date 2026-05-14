# Load environment variables automatically when entering a container shell
if [ -f /app/.env ]; then
  set -a
  source /app/.env
  set +a
fi
