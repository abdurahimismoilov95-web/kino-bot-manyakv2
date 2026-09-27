-- =============================================================================
--  MANYAK TV v2 - PostgreSQL Initial Schema
--  Bu file docker-entrypoint-initdb.d orqali birinchi marta run qilinadi.
--  TypeORM synchronize=true (dev) yoki migration (prod) bilan ishlatiladi.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- ILIKE performance uchun

-- =============================================================================
--  ENUM types
-- =============================================================================
CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE content_type_enum AS ENUM ('movie', 'series', 'short_drama', 'anime_series');
CREATE TYPE receipt_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE receipt_type_enum AS ENUM ('subscription', 'single_content');

-- =============================================================================
--  USERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id                 VARCHAR(32) PRIMARY KEY,
  telegram_id        VARCHAR(32) NOT NULL UNIQUE,
  first_name         VARCHAR(128) NOT NULL,
  last_name          VARCHAR(128),
  username           VARCHAR(64),
  avatar_url         TEXT,
  role               user_role_enum NOT NULL DEFAULT 'user',
  -- Subscription
  is_vip             BOOLEAN NOT NULL DEFAULT FALSE,
  vip_expires_at     TIMESTAMPTZ,
  subscription_plan_id VARCHAR(36),
  tokens             INT NOT NULL DEFAULT 0,
  -- Phone verification
  is_phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  phone_number       VARCHAR(20),
  -- Security
  hwid               TEXT,
  is_banned          BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason         TEXT,
  banned_at          TIMESTAMPTZ,
  -- Check-in
  checkin_streak     INT NOT NULL DEFAULT 0,
  last_checkin_date  DATE,
  -- Timestamps
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at       TIMESTAMPTZ
);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_is_vip ON users(is_vip);

-- =============================================================================
--  SUBSCRIPTION PLANS
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(128) NOT NULL,
  description    TEXT,
  price          INT NOT NULL,
  duration_days  INT NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_popular     BOOLEAN NOT NULL DEFAULT FALSE,
  badge          VARCHAR(32),
  device_limit   SMALLINT NOT NULL DEFAULT 1,
  sort_order     SMALLINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
--  PROMO CODES
-- =============================================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code              VARCHAR(32) NOT NULL UNIQUE,
  discount_percent  SMALLINT NOT NULL,
  plan_id           UUID,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  max_uses          INT,
  used_count        INT NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
--  CONTENTS (kino/serial/anime)
-- =============================================================================
CREATE TABLE IF NOT EXISTS contents (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                VARCHAR(255) NOT NULL,
  original_title       VARCHAR(255),
  type                 content_type_enum NOT NULL DEFAULT 'movie',
  catalog_id           VARCHAR(64),
  poster_url           TEXT,
  banner_url           TEXT,
  video_url            TEXT,
  hls_path             TEXT,
  transcode_status     VARCHAR(20) NOT NULL DEFAULT 'pending',
  available_qualities  JSONB NOT NULL DEFAULT '[]',
  description          TEXT,
  year                 SMALLINT,
  duration             VARCHAR(32),
  rating               DECIMAL(3,1) NOT NULL DEFAULT 0,
  genres               TEXT[] NOT NULL DEFAULT '{}',
  is_premium           BOOLEAN NOT NULL DEFAULT FALSE,
  is_vip_included      BOOLEAN NOT NULL DEFAULT TRUE,
  is_single_purchase   BOOLEAN NOT NULL DEFAULT FALSE,
  price                INT NOT NULL DEFAULT 0,
  is_trending          BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured          BOOLEAN NOT NULL DEFAULT FALSE,
  views_count          BIGINT NOT NULL DEFAULT 0,
  likes_count          INT NOT NULL DEFAULT 0,
  revenue              BIGINT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contents_title ON contents USING gin(title gin_trgm_ops);
CREATE INDEX idx_contents_type ON contents(type);
CREATE INDEX idx_contents_is_trending ON contents(is_trending);
CREATE INDEX idx_contents_is_featured ON contents(is_featured);

-- =============================================================================
--  EPISODES
-- =============================================================================
CREATE TABLE IF NOT EXISTS episodes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id           UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  season_number        SMALLINT NOT NULL DEFAULT 1,
  episode_number       SMALLINT NOT NULL,
  title                VARCHAR(255) NOT NULL,
  video_url            TEXT,
  hls_path             TEXT,
  transcode_status     VARCHAR(20) NOT NULL DEFAULT 'pending',
  available_qualities  JSONB NOT NULL DEFAULT '[]',
  duration             VARCHAR(32),
  is_free              BOOLEAN NOT NULL DEFAULT FALSE,
  views_count          BIGINT NOT NULL DEFAULT 0,
  thumbnail_url        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(content_id, season_number, episode_number)
);
CREATE INDEX idx_episodes_content_id ON episodes(content_id);

-- =============================================================================
--  RECEIPTS (to'lov cheklari)
-- =============================================================================
CREATE TABLE IF NOT EXISTS receipts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             receipt_type_enum NOT NULL DEFAULT 'subscription',
  status           receipt_status_enum NOT NULL DEFAULT 'pending',
  image_url        TEXT NOT NULL,
  plan_id          UUID,
  plan_name        VARCHAR(128),
  content_id       UUID,
  content_title    VARCHAR(255),
  amount           INT NOT NULL DEFAULT 0,
  promo_code       VARCHAR(32),
  discount_percent SMALLINT NOT NULL DEFAULT 0,
  notes            TEXT,
  reviewed_by      VARCHAR(32),
  reviewed_at      TIMESTAMPTZ,
  reject_reason    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_status ON receipts(status);

-- =============================================================================
--  WATCH HISTORY
-- =============================================================================
CREATE TABLE IF NOT EXISTS watch_history (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id        UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  episode_id        UUID REFERENCES episodes(id) ON DELETE SET NULL,
  progress_seconds  INT NOT NULL DEFAULT 0,
  duration_seconds  INT NOT NULL DEFAULT 0,
  is_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_watch_history_user_content ON watch_history(user_id, content_id);

-- =============================================================================
--  FAVORITES
-- =============================================================================
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id  UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- =============================================================================
--  Default seed data: Subscription Plans
-- =============================================================================
INSERT INTO subscription_plans (name, description, price, duration_days, is_popular, badge, sort_order)
VALUES
  ('1 Oylik',   'Barcha filmlar va seriallar', 30000,  30,  FALSE, NULL,         1),
  ('3 Oylik',   'Iqtisodiy variant',           70000,  90,  TRUE,  'OMMALASHGAN', 2),
  ('1 Yillik',  'Eng qimmatli variant',        200000, 365, FALSE, 'BEST VALUE', 3)
ON CONFLICT DO NOTHING;
