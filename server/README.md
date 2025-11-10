Manifest receiver (development example)

This is a tiny Express server that accepts a POST /api/manifest request and writes the JSON payload to public/img/manifest.json.

Usage (local/dev):

1. Install dependencies

   cd server
   npm init -y
   npm install express cors

2. Run (no auth - dev only)

   node receive-manifest.js

   The server listens on port 3000 by default.

3. Run with token (recommended):

   ADMIN_TOKEN=your-secret-token node receive-manifest.js

   The Admin UI must send the same token as the `x-admin-token` header when publishing.

Notes:
- This is intended as a simple local/dev receiver. In production you should:
  - Host the receiver behind proper authentication (do not use a plain token in client-side code)
  - Use HTTPS
  - Consider writing to an object store (S3) or perform deployment via CI instead of allowing direct writes to the webroot
  - Validate the incoming payload shape before writing

After a successful POST, the manifest will be available as `public/img/manifest.json` which the client-side Gallery already fetches using the app base URL.
