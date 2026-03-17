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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

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

    // If success, update student record and create auth user if needed
    if (resultCode === 0 && accountRef) {
      if (supabase) {
        try {
          const { data: student, error: studentErr } = await supabase
            .from('students')
            .select('*')
            .eq('registration_number', accountRef)
            .single();

          if (studentErr) {
            console.error('Error fetching student in callback', studentErr);
          }

          if (student) {
            const newFeesPaid = (student.fees_paid || 0) + (amount || 0);

            // If student has no linked auth user (id), create one using the service role
            if (!student.id) {
              try {
                // Prefer the student's provided email if available; otherwise create a placeholder
                const userEmail = student.email && student.email.includes('@') ? student.email : `${accountRef}@students.lashawndriving.local`;
                const tempPass = Math.random().toString(36).slice(-10) + 'A1!';

                // Create admin user via Supabase Admin API
                const { data: userData, error: createUserErr } = await supabase.auth.admin.createUser({
                  email: userEmail,
                  password: tempPass,
                  email_confirm: true
                });

                if (createUserErr) {
                  console.error('Error creating auth user in callback', createUserErr);
                } else if (userData && userData.user) {
                  // Update the student record with the new auth user id, fees_paid, set active status and store temp password temporarily
                  await supabase
                    .from('students')
                    .update({ id: userData.user.id, fees_paid: newFeesPaid, status: true, temp_password: tempPass })
                    .eq('registration_number', accountRef);
                }
              } catch (createErr) {
                console.error('Exception creating auth user in callback', createErr);
                // As a fallback still update fees and status
                await supabase
                  .from('students')
                  .update({ fees_paid: newFeesPaid, status: true })
                  .eq('registration_number', accountRef);
              }
            } else {
              // Student already has an auth id; just update fees and status
              await supabase
                .from('students')
                .update({ fees_paid: newFeesPaid, status: true })
                .eq('registration_number', accountRef);
            }
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

// Create a Stripe PaymentIntent for card payments
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, registration_number, receipt_email } = req.body;
    if (!amount || !registration_number) return res.status(400).json({ error: 'amount and registration_number required' });

    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'kes',
      receipt_email: receipt_email || undefined,
      metadata: { registration_number }
    });

    return res.json({ client_secret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (err) {
    console.error('create-payment-intent error', err);
    return res.status(500).json({ error: 'create payment intent failed' });
  }
});

// Confirm card payment and finalize student record
app.post('/api/confirm-card-payment', async (req, res) => {
  try {
    const { payment_intent_id, registration_number } = req.body;
    if (!payment_intent_id || !registration_number) return res.status(400).json({ error: 'payment_intent_id and registration_number required' });

    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (!intent) return res.status(404).json({ error: 'payment intent not found' });

    if (intent.status !== 'succeeded') return res.status(400).json({ error: 'payment not successful' });

    const amount = (intent.amount_received || intent.amount) / 100;

    // Finalize student record in Supabase
    if (supabase) {
      try {
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('registration_number', registration_number)
          .single();

        const newFeesPaid = ((student && student.fees_paid) || 0) + (amount || 0);

        if (student && !student.id) {
          // Create auth user
          const userEmail = student.email && student.email.includes('@') ? student.email : `${registration_number}@students.lashawndriving.local`;
          const tempPass = Math.random().toString(36).slice(-10) + 'A1!';
          const { data: userData, error: createUserErr } = await supabase.auth.admin.createUser({
            email: userEmail,
            password: tempPass,
            email_confirm: true
          });

          if (createUserErr) {
            console.error('Error creating auth user in confirm-card-payment', createUserErr);
            // still update fees and status
            await supabase.from('students').update({ fees_paid: newFeesPaid, status: true }).eq('registration_number', registration_number);
          } else {
            await supabase.from('students').update({ id: userData.user.id, fees_paid: newFeesPaid, status: true, temp_password: tempPass }).eq('registration_number', registration_number);
          }
        } else if (student) {
          await supabase.from('students').update({ fees_paid: newFeesPaid, status: true }).eq('registration_number', registration_number);
        }
      } catch (dbErr) {
        console.error('Error finalizing student after card payment', dbErr);
      }
    }

    return res.json({ ok: true, payment_intent: intent });
  } catch (err) {
    console.error('confirm-card-payment error', err);
    return res.status(500).json({ error: 'confirm card payment failed' });
  }
});

// Insert student through backend (protects service role key)
app.post('/api/students', async (req, res) => {
  try {
    const {
      registration_number,
      name,
      id_number,
      email,
      phone,
      course,
      fees_paid,
      total_fees,
      eligible_for_exams,
      status,
      enrollment_date,
      documents
    } = req.body;

    // Validate required fields
    if (!registration_number || !name || !email || !phone) {
      return res.status(400).json({ error: 'registration_number, name, email, and phone are required' });
    }

    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    // Check if student already exists
    const { data: existingStudent, error: checkErr } = await supabase
      .from('students')
      .select('id')
      .eq('registration_number', registration_number)
      .single();

    if (checkErr && checkErr.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected for new students
      console.error('Error checking existing student', checkErr);
      return res.status(500).json({ error: 'Failed to check existing student' });
    }

    if (existingStudent) {
      return res.status(400).json({ error: 'Student with this registration number already exists' });
    }

    // Prepare student payload
    const payload = {
      registration_number,
      name,
      id_number: id_number || null,
      email,
      phone,
      course: course || null,
      fees_paid: fees_paid || 0,
      total_fees: total_fees || 0,
      eligible_for_exams: eligible_for_exams || false,
      status: status !== undefined ? status : 'Active',
      enrollment_date: enrollment_date || new Date().toISOString(),
      documents: documents || null
    };

    // Insert student using service role key (bypasses RLS)
    const { data: newStudent, error: insertErr } = await supabase
      .from('students')
      .insert([payload])
      .select();

    if (insertErr) {
      console.error('Error inserting student', insertErr);
      return res.status(500).json({ error: 'Failed to insert student' });
    }

    // Create auth user if email is valid
    if (email && email.includes('@')) {
      try {
        const tempPass = Math.random().toString(36).slice(-10) + 'A1!';
        const { data: userData, error: createUserErr } = await supabase.auth.admin.createUser({
          email: email,
          password: tempPass,
          email_confirm: true
        });

        if (createUserErr) {
          console.error('Error creating auth user for student', createUserErr);
          // Still return success as student record was created; auth user can be created later
        } else if (userData && userData.user) {
          // Update student with auth user id and temp password
          await supabase
            .from('students')
            .update({ id: userData.user.id, temp_password: tempPass })
            .eq('registration_number', registration_number);
        }
      } catch (authErr) {
        console.error('Exception creating auth user', authErr);
      }
    }

    return res.status(201).json({ ok: true, student: newStudent?.[0] || payload });
  } catch (err) {
    console.error('Insert student error', err);
    return res.status(500).json({ error: 'Insert student failed' });
  }
});

app.listen(PORT, () => {
  console.info(`STK server running on port ${PORT}`);
});
