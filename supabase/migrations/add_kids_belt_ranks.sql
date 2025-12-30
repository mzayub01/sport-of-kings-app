-- Add kids belt ranks to the belt_rank enum
-- Kids belt scheme: grey, grey-white, yellow, yellow-white, orange, orange-white, green, green-white

ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'grey';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'grey-white';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'yellow';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'yellow-white';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'orange';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'orange-white';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'green';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'green-white';
