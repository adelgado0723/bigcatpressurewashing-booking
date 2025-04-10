/*
  # Add security measures for rate limiter implementation

  1. Changes
    - Create rate_limits table with proper security
    - Add indexes for performance
    - Add cleanup function for old records
    - Add RLS policies
    - Add validation functions
*/

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address text NOT NULL,
  domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON rate_limits(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_domain ON rate_limits(ip_address, domain);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  TO service_role
  USING (true);

-- Create function to validate IP address
CREATE OR REPLACE FUNCTION is_valid_ip(ip text)
RETURNS boolean AS $$
BEGIN
  RETURN ip ~ '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
    OR ip ~ '^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate domain
CREATE OR REPLACE FUNCTION is_valid_domain(domain text)
RETURNS boolean AS $$
BEGIN
  RETURN domain ~ '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE timestamp < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run cleanup daily
CREATE OR REPLACE FUNCTION trigger_cleanup_rate_limits()
RETURNS trigger AS $$
BEGIN
  PERFORM cleanup_rate_limits();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER cleanup_rate_limits_trigger
  AFTER INSERT ON rate_limits
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_rate_limits();

-- Add constraints
ALTER TABLE rate_limits
  ADD CONSTRAINT valid_ip CHECK (is_valid_ip(ip_address)),
  ADD CONSTRAINT valid_domain CHECK (is_valid_domain(domain)),
  ADD CONSTRAINT positive_count CHECK (count >= 0); 