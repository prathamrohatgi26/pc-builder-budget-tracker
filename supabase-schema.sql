-- Create the pc_checklist table
CREATE TABLE IF NOT EXISTS pc_checklist (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_data JSONB NOT NULL DEFAULT '{}',
  prices_data JSONB NOT NULL DEFAULT '{}',
  part_names_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on updated_at for better query performance
CREATE INDEX IF NOT EXISTS idx_pc_checklist_updated_at ON pc_checklist(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE pc_checklist ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to only access their own data
CREATE POLICY "Users can only access their own pc_checklist" ON pc_checklist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_pc_checklist_updated_at 
  BEFORE UPDATE ON pc_checklist 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
