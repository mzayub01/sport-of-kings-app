-- Create junction table for classes to membership types (many-to-many)
CREATE TABLE IF NOT EXISTS class_membership_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    membership_type_id UUID NOT NULL REFERENCES membership_types(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, membership_type_id)
);

-- Enable RLS
ALTER TABLE class_membership_types ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Authenticated can read class membership types"
    ON class_membership_types FOR SELECT
    TO authenticated
    USING (true);

-- Allow admin/instructors to manage
CREATE POLICY "Admins can manage class membership types"
    ON class_membership_types FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_class_membership_types_class_id ON class_membership_types(class_id);
CREATE INDEX IF NOT EXISTS idx_class_membership_types_membership_type_id ON class_membership_types(membership_type_id);
