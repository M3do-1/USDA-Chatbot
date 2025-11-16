/*
  # Enhance USDA Programs Schema for Business-Ready Chatbot

  ## Changes
  
  1. Add new columns to usda_programs table
    - `eligibility` (text) - Who can apply for this program
    - `benefits` (text) - What benefits/funding the program provides
    - `application_process` (text) - How to apply
    - `contact_info` (text) - Contact details for more information
    - `keywords` (text[]) - Array of searchable keywords for better matching
    - `program_code` (text) - Official program code/number
    - `funding_range` (text) - Min/max funding amounts
    - `deadline_info` (text) - Application deadlines
    
  2. Add indexes for better search performance
    - GIN index on keywords array
    - Full-text search indexes on title and description
  
  3. Create chat_sessions table for persistence
    - Store user chat sessions
    - Track conversation history
    
  4. Create feedback table for analytics
    - Track helpful/not helpful ratings
    - Analyze bot performance
*/

-- Add new columns to existing table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usda_programs' AND column_name = 'eligibility'
  ) THEN
    ALTER TABLE usda_programs 
    ADD COLUMN eligibility text,
    ADD COLUMN benefits text,
    ADD COLUMN application_process text,
    ADD COLUMN contact_info text,
    ADD COLUMN keywords text[],
    ADD COLUMN program_code text,
    ADD COLUMN funding_range text,
    ADD COLUMN deadline_info text;
  END IF;
END $$;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_usda_programs_keywords ON usda_programs USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_usda_programs_category ON usda_programs(category);
CREATE INDEX IF NOT EXISTS idx_usda_programs_title_search ON usda_programs USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_usda_programs_description_search ON usda_programs USING GIN(to_tsvector('english', COALESCE(description, '')));

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create and view chat sessions"
  ON chat_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  attachment_name text,
  attachment_size integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create and view messages"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Create feedback table
CREATE TABLE IF NOT EXISTS message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  helpful boolean NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON message_feedback FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_feedback_message ON message_feedback(message_id);