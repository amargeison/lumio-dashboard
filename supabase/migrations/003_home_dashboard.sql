-- Home dashboard insights (populated by HM-01 at 6am)
CREATE TABLE IF NOT EXISTS home_insights (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date         DATE NOT NULL UNIQUE,
  insights     JSONB DEFAULT '[]',
  quick_wins   JSONB DEFAULT '[]',
  not_to_miss  JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily tasks (from Notion sync + manual)
CREATE TABLE IF NOT EXISTS home_tasks (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id),
  title            TEXT NOT NULL,
  description      TEXT,
  due_date         DATE,
  due_time         TEXT,
  priority         TEXT DEFAULT 'medium',
  category         TEXT,
  source           TEXT DEFAULT 'manual',
  linked_workflow  TEXT,
  done             BOOLEAN DEFAULT false,
  done_at          TIMESTAMPTZ,
  date             DATE DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE home_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_tasks    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_insights" ON home_insights USING (auth.role() = 'service_role');
CREATE POLICY "user_own_tasks"        ON home_tasks    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_home_tasks_date    ON home_tasks(date);
CREATE INDEX IF NOT EXISTS idx_home_insights_date ON home_insights(date);
