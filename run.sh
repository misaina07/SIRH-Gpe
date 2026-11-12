#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

command -v java >/dev/null 2>&1 || { echo "Java is required. Install JDK 21 or newer." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Node.js and npm are required." >&2; exit 1; }
[[ -x "$ROOT_DIR/backend/mvnw" ]] || { echo "Maven wrapper not found at backend/mvnw." >&2; exit 1; }

if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
  echo "Installing frontend dependencies..."
  npm install
fi

export SIRH_DEMO_CREDENTIALS_ENABLED="${SIRH_DEMO_CREDENTIALS_ENABLED:-true}"
export SIRH_DEMO_PASSWORD_RH="${SIRH_DEMO_PASSWORD_RH:-rh}"
export SIRH_DEMO_PASSWORD_MANAGER="${SIRH_DEMO_PASSWORD_MANAGER:-manager}"
export SIRH_DEMO_PASSWORD_FINANCE="${SIRH_DEMO_PASSWORD_FINANCE:-finance}"
export SIRH_DEMO_PASSWORD_DIRECTION="${SIRH_DEMO_PASSWORD_DIRECTION:-codir}"

api_pid=""
cleanup() {
  if [[ -n "$api_pid" ]] && kill -0 "$api_pid" 2>/dev/null; then
    kill "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting Spring Boot API (http://localhost:8080/api)..."
(cd "$ROOT_DIR/backend" && ./mvnw spring-boot:run) &
api_pid=$!
echo "Starting React app (http://localhost:3000)..."
npm run dev
