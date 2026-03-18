const { createClient } = require("@supabase/supabase-js");

let db = null;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (process.env.SUPABASE_URL && supabaseKey) {
  db = createClient(process.env.SUPABASE_URL, supabaseKey);
}

module.exports = db;

