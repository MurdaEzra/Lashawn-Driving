LASHAWN DRIVING

## Deploying to Render (backend + frontend)

1. Backend service (Node.js)
	- Create a Web Service on Render pointing to this repo (or the `server/` subfolder).
	- Build command: `cd server && npm install`
	- Start command: `cd server && npm start`
	- Add these environment variables in Render (do NOT commit secrets to git):
	  - `MPESA_CONSUMER_KEY`
	  - `MPESA_CONSUMER_SECRET`
	  - `MPESA_SHORTCODE`
	  - `MPESA_PASSKEY`
	  - `MPESA_CALLBACK_URL` = `https://lashawnacademy.com/api/stk-callback`
	  - `SUPABASE_URL`
	  - `SUPABASE_SERVICE_ROLE_KEY` (mark secret)
	  - `CORS_ORIGINS` = `https://lashawnacademy.com,http://localhost:5173`
	  - `PORT` = `4000` (optional)

2. Frontend (Static site)
	- Create a Static Site on Render or a Web Service that serves static files.
	- Build command: `npm run build`
	- Publish directory: `dist`
	- Set environment variable for the API base the frontend should call:
	  - `VITE_API_BASE` = `https://<your-backend-service>.onrender.com` (or your custom domain)

3. Custom domain & TLS
	- Add `lashawnacademy.com` to Render service Custom Domains and follow DNS instructions.
	- Render provisions TLS automatically (Let's Encrypt).

4. M-Pesa (Daraja) callback
	- In Daraja, set the callback URL to `https://lashawnacademy.com/api/stk-callback`.

5. Quick local test for callback handling
	- With the backend running locally, simulate Daraja callback:

```bash
curl -v -X POST http://localhost:4000/api/stk-callback \
  -H 'Content-Type: application/json' \
  -d '{"Body":{"stkCallback":{"MerchantRequestID":"123","CheckoutRequestID":"abc","ResultCode":0,"ResultDesc":"The service request is processed successfully.","CallbackMetadata":{"Item":[{"Name":"Amount","Value":1000},{"Name":"MpesaReceiptNumber","Value":"ABC123"},{"Name":"AccountReference","Value":"LASH-2026-1234"}]}}}}'
```

If the server processes the callback, it will attempt to update the student's `fees_paid` in Supabase (ensure `SUPABASE_SERVICE_ROLE_KEY` is set in the environment).
