require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Configure CORS: allow only origins listed in CORS_ORIGINS (comma-separated)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,https://lashawnacademy.com').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests (Postman, server-side)
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'));
  }
}));

app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Callback DB updates will fail.');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

// Endpoint to initiate STK Push
app.post('/api/stkpush', async (req, res) => {
  try {
    const { phone, amount, registration_number } = req.body;
    if (!phone || !amount || !registration_number) {
      return res.status(400).json({ error: 'phone, amount and registration_number required' });
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
      return res.status(500).json({ error: 'MPESA credentials not configured on server' });
    }

    // 1. Get OAuth token
    const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
      }
    });

    const accessToken = tokenRes.data.access_token;

    // 2. Prepare STK Push request
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: registration_number,
      TransactionDesc: `Payment for ${registration_number}`
    };

    const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Return only necessary response data; avoid echoing sensitive internals
    return res.json({ data: stkRes.data });
  } catch (err) {
    console.error('STK push error', err.message || err);
    return res.status(500).json({ error: 'STK push failed' });
  }
});

// Callback endpoint Daraja will call
app.post('/api/stk-callback', async (req, res) => {
  // Respond quickly to Daraja
  res.json({ ok: true });

  try {
    const body = req.body;
    // Daraja wraps result in Body.stkCallback
    const callback = body.Body && body.Body.stkCallback ? body.Body.stkCallback : body;

    const checkoutRequestID = callback.CheckoutRequestID || (callback.Result && callback.Result.CheckoutRequestID);
    const resultCode = callback.ResultCode || callback.resultCode || 1;

    // Extract amount and account reference if present
    let amount = 0;
    let accountRef = '';

    if (callback.CallbackMetadata && callback.CallbackMetadata.Item) {
      const items = callback.CallbackMetadata.Item;
      const amtItem = items.find(i => i.Name === 'Amount');
      const acctItem = items.find(i => i.Name === 'AccountReference');
      if (amtItem) amount = amtItem.Value;
      if (acctItem) accountRef = acctItem.Value;
    } else if (callback.MerchantRequestID) {
      // older formats
      accountRef = callback.AccountReference || '';
    }

    // If success, update student record
    if (resultCode === 0 && accountRef) {
      // Find student by registration_number and update fees_paid
      if (supabase) {
        try {
          const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('registration_number', accountRef)
            .single();

          if (student) {
            const newFeesPaid = (student.fees_paid || 0) + (amount || 0);
            // If your DB uses a boolean `status` (active/inactive), write boolean true for Active
            await supabase
              .from('students')
              .update({ fees_paid: newFeesPaid, status: true })
              .eq('registration_number', accountRef);
          }
        } catch (dbErr) {
          console.error('Supabase update failed in callback', dbErr);
        }
      }
    }
  } catch (err) {
    console.error('Error handling STK callback', err);
  }
});

app.listen(PORT, () => {
  console.info(`STK server running on port ${PORT}`);
});
