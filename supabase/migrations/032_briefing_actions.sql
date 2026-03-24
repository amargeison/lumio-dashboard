-- 032_briefing_actions.sql
-- Tracks actions taken from the Morning Roundup inbox and briefing items

CREATE TABLE IF NOT EXISTS briefing_actions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text        NOT NULL DEFAULT 'default',
  item_type   text        NOT NULL,  -- 'email' | 'slack' | 'notion' | 'linkedin' | 'workflow' | 'meeting'
  item_ref    text        NOT NULL,  -- identifier for the item (e.g. email id, slack msg id)
  action_taken text       NOT NULL,  -- 'replied' | 'archived' | 'done' | 'read' | 'accepted' | 'ignored' | 'reacted'
  actioned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE briefing_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "briefing_actions_open" ON briefing_actions;
CREATE POLICY "briefing_actions_open" ON briefing_actions
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS briefing_actions_user_day_idx
  ON briefing_actions (user_id, actioned_at);
