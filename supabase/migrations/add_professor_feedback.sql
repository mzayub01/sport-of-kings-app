-- Professor Feedback Table
-- Allows professors to send general feedback/comments to members

CREATE TABLE IF NOT EXISTS professor_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON professor_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_professor_id ON professor_feedback(professor_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON professor_feedback(created_at DESC);

-- RLS Policies
ALTER TABLE professor_feedback ENABLE ROW LEVEL SECURITY;

-- Members can read their own feedback
CREATE POLICY "Members can read own feedback" ON professor_feedback
    FOR SELECT USING (user_id = auth.uid());

-- Professors and admins can insert feedback
CREATE POLICY "Professors can insert feedback" ON professor_feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('professor', 'admin')
        )
    );

-- Professors and admins can view feedback they sent
CREATE POLICY "Professors can view sent feedback" ON professor_feedback
    FOR SELECT USING (professor_id = auth.uid());

-- Members can mark their feedback as read
CREATE POLICY "Members can update own feedback" ON professor_feedback
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE professor_feedback IS 'Stores feedback comments from professors to members';
