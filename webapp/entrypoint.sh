#!/bin/sh
cat <<EOF > /app/build/env.js
window.globalThis.env = {
  ENVVAR_SOCKET_URL: "${ENVVAR_SOCKET_URL}",
  ENVVAR_TOTAL_CUES: "${ENVVAR_TOTAL_CUES}",
  ENVVAR_ADMIN_PASSWORD: "${ENVVAR_ADMIN_PASSWORD}"
};
EOF

exec "$@"
