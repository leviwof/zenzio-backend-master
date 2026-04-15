# Run this for once

CREATE TABLE IF NOT EXISTS fleet_attendance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fleet_uid varchar NOT NULL,
    date date NOT NULL,
    logs jsonb DEFAULT '{"events": []}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
) PARTITION BY RANGE (date);
