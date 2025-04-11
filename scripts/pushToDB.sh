#!/bin/sh
eval $(grep '^SUPABASE_DB_PASSWORD' .env) 
echo "Pushing to DB"
# node_modules/.bin/supabase db push --include-all --db-url \"$SUPABASE_DB_URL\"
node_modules/.bin/supabase db push -p $SUPABASE_DB_PASSWORD