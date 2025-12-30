-- Add kids belt ranks to the belt_rank enum
-- Kids belt scheme: white → grey-white → grey → grey-black → orange-white → orange → orange-black → yellow-white → yellow → yellow-black → green-white → green → green-black

ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'grey';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'grey-white';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'grey-black';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'yellow';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'yellow-white';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'yellow-black';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'orange';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'orange-white';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'orange-black';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'green';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'green-white';
ALTER TYPE belt_rank ADD VALUE IF NOT EXISTS 'green-black';
