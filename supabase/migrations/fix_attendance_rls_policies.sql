-- Fix RLS policies for attendance table
-- Enable RLS if not already enabled
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own attendance records
DROP POLICY IF EXISTS "Users can view their own attendance" ON attendance;
CREATE POLICY "Users can view their own attendance"
    ON attendance FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow parents to view their children's attendance
DROP POLICY IF EXISTS "Parents can view children attendance" ON attendance;
CREATE POLICY "Parents can view children attendance"
    ON attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles child
            JOIN profiles parent ON child.parent_guardian_id = parent.id
            WHERE child.user_id = attendance.user_id
            AND parent.user_id = auth.uid()
        )
    );

-- Allow users to insert their own attendance
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
CREATE POLICY "Users can insert own attendance"
    ON attendance FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow parents to insert children's attendance
DROP POLICY IF EXISTS "Parents can insert children attendance" ON attendance;
CREATE POLICY "Parents can insert children attendance"
    ON attendance FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles child
            JOIN profiles parent ON child.parent_guardian_id = parent.id
            WHERE child.user_id = attendance.user_id
            AND parent.user_id = auth.uid()
        )
    );
