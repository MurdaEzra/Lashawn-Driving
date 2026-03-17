import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kyhvvsnunxkxylelqbjv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aHZ2c251bnhreHlsZWxxYmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzI1NjEsImV4cCI6MjA4ODk0ODU2MX0.PUu_dZOXravXusQ2Q_DwUmDs_Vb52O1LcP731hAbsTE'

export const supabase = createClient(supabaseUrl, supabaseKey)