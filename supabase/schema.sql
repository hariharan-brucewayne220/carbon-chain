-- Run this first in Supabase SQL Editor
-- Requires PostGIS extension

CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── facilities ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS facilities (
    id                  SERIAL PRIMARY KEY,
    chain_facility_id   INTEGER,                         -- facilityId from smart contract
    org_name            TEXT NOT NULL,
    facility_name       TEXT NOT NULL,
    industry_type       TEXT NOT NULL,
    org_wallet          TEXT,
    location            GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS geography point
    baseline_emissions  INTEGER NOT NULL,                -- tonnes CO2e/year
    reduction_target    INTEGER DEFAULT 20,              -- percentage
    registered_at       TIMESTAMPTZ DEFAULT NOW(),
    active              BOOLEAN DEFAULT TRUE,
    -- EPA source fields (populated by seed pipeline)
    epa_facility_id     TEXT,
    state_code          TEXT,                            -- 2-digit FIPS (e.g. "06" = CA)
    county              TEXT
);

CREATE INDEX IF NOT EXISTS idx_facilities_location  ON facilities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_facilities_state     ON facilities(state_code);
CREATE INDEX IF NOT EXISTS idx_facilities_industry  ON facilities(industry_type);
CREATE INDEX IF NOT EXISTS idx_facilities_wallet    ON facilities(org_wallet);
CREATE INDEX IF NOT EXISTS idx_facilities_chain_id  ON facilities(chain_facility_id);

-- ─── emission_reports ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS emission_reports (
    id              SERIAL PRIMARY KEY,
    facility_id     INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
    co2_tonnes      INTEGER NOT NULL,
    period          TEXT NOT NULL,           -- "2023", "2024", "2024-Q1"
    meets_target    BOOLEAN NOT NULL,
    percent_change  NUMERIC(5,2),            -- absolute % vs baseline
    is_reduction    BOOLEAN,
    reported_at     TIMESTAMPTZ DEFAULT NOW(),
    tx_hash         TEXT                     -- Sepolia transaction hash for on-chain verification
);

CREATE INDEX IF NOT EXISTS idx_reports_facility  ON emission_reports(facility_id);
CREATE INDEX IF NOT EXISTS idx_reports_period    ON emission_reports(period);
CREATE INDEX IF NOT EXISTS idx_reports_target    ON emission_reports(meets_target);

-- ─── fema_risk_index ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fema_risk_index (
    id                      SERIAL PRIMARY KEY,
    state_name              TEXT NOT NULL,
    county_name             TEXT NOT NULL,
    state_fips              TEXT NOT NULL,   -- 2-digit (e.g. "06")
    county_fips             TEXT NOT NULL,   -- 5-digit (e.g. "06037")
    risk_score              NUMERIC(8,2),
    risk_rating             TEXT,            -- "Very High", "Relatively High", "Relatively Moderate", "Relatively Low", "Very Low"
    flood_risk_score        NUMERIC(8,2),
    flood_risk_rating       TEXT,
    wildfire_risk_score     NUMERIC(8,2),
    wildfire_risk_rating    TEXT,
    hurricane_risk_score    NUMERIC(8,2),
    hurricane_risk_rating   TEXT,
    expected_annual_loss    NUMERIC(15,2),   -- dollars
    social_vulnerability    NUMERIC(8,2),
    community_resilience    NUMERIC(8,2)
);

CREATE INDEX IF NOT EXISTS idx_fema_county      ON fema_risk_index(county_fips);
CREATE INDEX IF NOT EXISTS idx_fema_state       ON fema_risk_index(state_fips);
CREATE INDEX IF NOT EXISTS idx_fema_state_county ON fema_risk_index(state_fips, county_name);

-- ─── us_states ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS us_states (
    id          SERIAL PRIMARY KEY,
    state_name  TEXT NOT NULL,
    state_code  TEXT NOT NULL,               -- "CA", "NY" (2-letter abbreviation)
    state_fips  TEXT NOT NULL,               -- "06", "36" (2-digit FIPS)
    geom        GEOGRAPHY(MULTIPOLYGON, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_states_geom      ON us_states USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_states_code      ON us_states(state_code);
CREATE INDEX IF NOT EXISTS idx_states_fips      ON us_states(state_fips);
