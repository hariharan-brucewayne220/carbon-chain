-- PostGIS RPC functions — callable from Supabase JS client via supabase.rpc()
-- Run after schema.sql

-- ─── 1. nearby_facilities ────────────────────────────────────────────────────
-- Find facilities within `radius_meters` of a lat/lng point.
-- Uses ST_DWithin on the GEOGRAPHY column (accurate great-circle distance).

CREATE OR REPLACE FUNCTION nearby_facilities(
    lat           DOUBLE PRECISION,
    lng           DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 50000
)
RETURNS TABLE (
    id                  INTEGER,
    org_name            TEXT,
    facility_name       TEXT,
    industry_type       TEXT,
    baseline_emissions  INTEGER,
    latest_co2          INTEGER,
    meets_target        BOOLEAN,
    distance_km         DOUBLE PRECISION,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
    SELECT
        f.id,
        f.org_name,
        f.facility_name,
        f.industry_type,
        f.baseline_emissions,
        latest.co2_tonnes   AS latest_co2,
        latest.meets_target,
        ROUND(
            (ST_Distance(f.location, ST_MakePoint(lng, lat)::geography) / 1000)::numeric,
            2
        )::double precision AS distance_km,
        ST_Y(f.location::geometry) AS latitude,
        ST_X(f.location::geometry) AS longitude
    FROM facilities f
    LEFT JOIN LATERAL (
        SELECT co2_tonnes, meets_target
        FROM emission_reports er
        WHERE er.facility_id = f.id
        ORDER BY er.reported_at DESC
        LIMIT 1
    ) latest ON TRUE
    WHERE ST_DWithin(
        f.location,
        ST_MakePoint(lng, lat)::geography,
        radius_meters
    )
    AND f.active = TRUE
    ORDER BY distance_km;
$$;


-- ─── 2. facilities_in_risk_zones ─────────────────────────────────────────────
-- Facilities joined to FEMA NRI data by state FIPS + county name.
-- risk_type: 'flood' | 'wildfire' | 'hurricane' | 'composite'

CREATE OR REPLACE FUNCTION facilities_in_risk_zones(
    risk_type  TEXT DEFAULT 'flood'
)
RETURNS TABLE (
    facility_id         INTEGER,
    facility_name       TEXT,
    org_name            TEXT,
    industry_type       TEXT,
    state_code          TEXT,
    county              TEXT,
    risk_score          NUMERIC,
    risk_rating         TEXT,
    baseline_emissions  INTEGER,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id AS facility_id,
        f.facility_name,
        f.org_name,
        f.industry_type,
        f.state_code,
        f.county,
        CASE risk_type
            WHEN 'flood'     THEN nri.flood_risk_score
            WHEN 'wildfire'  THEN nri.wildfire_risk_score
            WHEN 'hurricane' THEN nri.hurricane_risk_score
            ELSE nri.risk_score
        END AS risk_score,
        CASE risk_type
            WHEN 'flood'     THEN nri.flood_risk_rating
            WHEN 'wildfire'  THEN nri.wildfire_risk_rating
            WHEN 'hurricane' THEN nri.hurricane_risk_rating
            ELSE nri.risk_rating
        END AS risk_rating,
        f.baseline_emissions,
        ST_Y(f.location::geometry) AS latitude,
        ST_X(f.location::geometry) AS longitude
    FROM facilities f
    JOIN fema_risk_index nri
        ON  f.state_code = nri.state_fips
        AND f.county     = nri.county_name
    WHERE (
        CASE risk_type
            WHEN 'flood'     THEN nri.flood_risk_rating
            WHEN 'wildfire'  THEN nri.wildfire_risk_rating
            WHEN 'hurricane' THEN nri.hurricane_risk_rating
            ELSE nri.risk_rating
        END
    ) IN ('Very High', 'Relatively High')
    AND f.active = TRUE
    ORDER BY risk_score DESC NULLS LAST;
END;
$$;


-- ─── 3. emissions_by_state ───────────────────────────────────────────────────
-- Aggregate emissions per state for choropleth.
-- Joins facilities to us_states on state_code.

CREATE OR REPLACE FUNCTION emissions_by_state()
RETURNS TABLE (
    state_code              TEXT,
    state_name              TEXT,
    facility_count          BIGINT,
    total_baseline          BIGINT,
    total_latest_emissions  BIGINT,
    compliant_count         BIGINT,
    non_compliant_count     BIGINT,
    no_report_count         BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        f.state_code,
        s.state_name,
        COUNT(DISTINCT f.id)                                        AS facility_count,
        SUM(f.baseline_emissions)                                   AS total_baseline,
        SUM(latest.co2_tonnes)                                      AS total_latest_emissions,
        COUNT(CASE WHEN latest.meets_target = TRUE  THEN 1 END)     AS compliant_count,
        COUNT(CASE WHEN latest.meets_target = FALSE THEN 1 END)     AS non_compliant_count,
        COUNT(CASE WHEN latest.co2_tonnes IS NULL   THEN 1 END)     AS no_report_count
    FROM facilities f
    JOIN us_states s ON f.state_code = s.state_fips
    LEFT JOIN LATERAL (
        SELECT co2_tonnes, meets_target
        FROM emission_reports er
        WHERE er.facility_id = f.id
        ORDER BY er.reported_at DESC
        LIMIT 1
    ) latest ON TRUE
    WHERE f.active = TRUE
    GROUP BY f.state_code, s.state_name
    ORDER BY total_latest_emissions DESC NULLS LAST;
$$;


-- ─── 4. facility_risk_score ──────────────────────────────────────────────────
-- Composite risk for a single facility:
--   - emission compliance from latest report
--   - FEMA NRI flood/wildfire/hurricane ratings
--   - overall_risk: HIGH if both non-compliant AND NRI score > 50; MEDIUM if either; LOW otherwise

CREATE OR REPLACE FUNCTION facility_risk_score(facility_row_id INTEGER)
RETURNS TABLE (
    facility_name       TEXT,
    org_name            TEXT,
    emission_compliance TEXT,
    percent_vs_baseline NUMERIC,
    flood_risk          TEXT,
    wildfire_risk       TEXT,
    hurricane_risk      TEXT,
    composite_nri_score NUMERIC,
    overall_risk        TEXT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        f.facility_name,
        f.org_name,
        CASE
            WHEN latest.meets_target IS NULL  THEN 'No Data'
            WHEN latest.meets_target = TRUE   THEN 'Compliant'
            ELSE                                   'Non-Compliant'
        END                                 AS emission_compliance,
        latest.percent_change               AS percent_vs_baseline,
        COALESCE(nri.flood_risk_rating,     'Unknown') AS flood_risk,
        COALESCE(nri.wildfire_risk_rating,  'Unknown') AS wildfire_risk,
        COALESCE(nri.hurricane_risk_rating, 'Unknown') AS hurricane_risk,
        COALESCE(nri.risk_score, 0)         AS composite_nri_score,
        CASE
            WHEN latest.meets_target = FALSE AND COALESCE(nri.risk_score, 0) > 50 THEN 'HIGH'
            WHEN latest.meets_target = FALSE OR  COALESCE(nri.risk_score, 0) > 50 THEN 'MEDIUM'
            ELSE 'LOW'
        END                                 AS overall_risk
    FROM facilities f
    LEFT JOIN LATERAL (
        SELECT meets_target, percent_change
        FROM emission_reports er
        WHERE er.facility_id = f.id
        ORDER BY er.reported_at DESC
        LIMIT 1
    ) latest ON TRUE
    LEFT JOIN fema_risk_index nri
        ON  f.state_code = nri.state_fips
        AND f.county     = nri.county_name
    WHERE f.id = facility_row_id;
$$;
