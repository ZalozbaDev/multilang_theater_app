#!/bin/sh
cat <<EOF > /app/build/env.js
window.globalThis.env = {
  SOCKET_URL: "${SOCKET_URL}",
  ADMIN_PASSWORD: "${ADMIN_PASSWORD}"
};
EOF

exec "$@"
