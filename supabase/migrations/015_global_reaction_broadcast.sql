-- =====================================================
-- Global Reaction Broadcast System (SUPABASE VERSION)
-- =====================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS broadcast_reaction_change() CASCADE;

-- Create function to broadcast via Supabase Realtime
CREATE OR REPLACE FUNCTION broadcast_reaction_change()
RETURNS TRIGGER AS $$
DECLARE
  reaction_emoji TEXT;
  payload JSONB;
BEGIN
  -- Get emoji for the reaction
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    SELECT emoji_unicode INTO reaction_emoji
    FROM reactions
    WHERE id = NEW.reaction_id;
  ELSE
    SELECT emoji_unicode INTO reaction_emoji
    FROM reactions
    WHERE id = OLD.reaction_id;
  END IF;

  -- Construct minimal payload
  payload := jsonb_build_object(
    'event', TG_OP,
    'target_type', COALESCE(NEW.target_type, OLD.target_type),
    'target_id', COALESCE(NEW.target_id, OLD.target_id),
    'user_id', COALESCE(NEW.user_id, OLD.user_id),
    'reaction_id', COALESCE(NEW.reaction_id, OLD.reaction_id),
    'emoji', reaction_emoji,
    'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT
  );

  -- ✅ USE SUPABASE REALTIME BROADCAST INSTEAD OF pg_notify
  PERFORM realtime.send(
    jsonb_build_object(
      'type', 'broadcast',
      'event', 'reaction_update',
      'payload', payload
    ),
    'global_reactions', -- Channel name
    NULL, -- Message ID (auto-generated)
    NULL  -- Headers
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to post_reactions table
DROP TRIGGER IF EXISTS reaction_change_broadcast ON post_reactions;

CREATE TRIGGER reaction_change_broadcast
  AFTER INSERT OR UPDATE OR DELETE ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_reaction_change();
