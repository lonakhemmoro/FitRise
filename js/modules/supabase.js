import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const VITE_SUPABASE_URL = "https://oifbtwniinwpurkxjurp.supabase.co";
const VITE_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZmJ0d25paW53cHVya3hqdXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjM2MTcsImV4cCI6MjA2ODE5OTYxN30.wEJ7B3rhoA5w6Svyu9rrSnr9hui1sIsMEfJ5ok_2F6w";

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

export default supabase;
