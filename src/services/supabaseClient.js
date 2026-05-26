import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wssypykikptqckhqugee.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indzc3lweWtpa3B0cWNraHF1Z2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDAxNDMsImV4cCI6MjA5NTM3NjE0M30.vdOhYD4EcDsQl6Sz4dTIvH47aPqDYsn469eKeEhLips';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
