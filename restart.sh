#!/usr/bin/env bash
set -e
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

# Arrêter uniquement les anciens processus Node de ce projet.
project_dir="$PWD"
for process_dir in /proc/[0-9]*; do
  process_cwd=$(readlink "$process_dir/cwd" 2>/dev/null || true)
  [[ "$process_cwd" == "$project_dir" ]] || continue
  mapfile -d '' -t process_args < "$process_dir/cmdline" 2>/dev/null || continue
  if [[ "${process_args[0]##*/}" == node && ( "${process_args[1]:-}" == src/server.js || "${process_args[1]:-}" == src/bot.js ) ]]; then
    kill "${process_dir##*/}" 2>/dev/null || true
  fi
done

# Ctrl+C arrête les deux programmes.
cleanup() {
  trap - EXIT INT TERM
  kill "${server_pid:-}" "${bot_pid:-}" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Attendre que le port de l'ancien serveur soit libéré.
for attempt in {1..30}; do
  if ! ss -ltnH 'sport = :3000' | read -r _; then break; fi
  sleep 0.1
done

node src/server.js &
server_pid=$!
node src/bot.js &
bot_pid=$!

printf 'Express et bot démarrés. Ctrl+C pour tout arrêter.\n'
wait -n "$server_pid" "$bot_pid"
