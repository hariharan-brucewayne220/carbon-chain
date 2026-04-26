# CarbonChain — Decentralized Carbon Footprint Reporting Platform

## Complete Spec (Final Version)

---

## 1. Problem Statement

Corporate carbon reporting suffers from three systemic failures (Cornell npj Climate Action, Feb 2026):
- **Inadequate verification**: Deloitte found that leading carbon standard providers overrepresent carbon credits due to weak verification
- **Double counting**: Microsoft was caught claiming offsets also claimed by the Danish government via Orsted
- **Limited transparency**: Organizations can retroactively edit or suppress unfavorable emission records

The EU Blockchain for Climate Action initiative and multiple peer-reviewed papers (2024-2026) confirm that blockchain's immutability + smart contract verification directly addresses all three failures. Our platform demonstrates this architecture.

**CEARTscore alignment**: CEARTscore builds due diligence tools for clean energy projects — risk identification, benchmarking, and finance-ready reporting. CarbonChain demonstrates the same pattern: immutable records, automated verification, geospatial risk analysis, and transparent reporting for climate accountability.

---

## 2. Architecture

```
┌──────────────────────────────────────────────┐
│              React Frontend (Netlify)          │
│   Google Maps · Recharts · ethers.js           │
│   @react-google-maps/api · @supabase/supabase-js │
└──────┬──────────────────────┬────────────────┘
       │                      │
       │ ethers.js            │ Supabase JS Client
       │ (write to chain)     │ (read fast, spatial queries)
       │                      │
┌──────▼──────────┐    ┌─────▼───────────────────┐
│  Sepolia Testnet │    │  Supabase PostgreSQL     │
│  CarbonRegistry  │    │  + PostGIS Extension     │
│  Smart Contract  │    │                          │
│  (Solidity)      │    │  Tables:                 │
└─────────────────┘    │  - facilities            │
                        │  - emission_reports      │
                        │  - fema_risk_index       │
                        │  - us_states (polygons)  │
                        │                          │
                        │  RPC Functions:          │
                        │  - nearby_facilities()   │
                        │  - facilities_in_risk()  │
                        │  - emissions_by_state()  │
                        │  - facility_risk_score() │
                        └──────────────────────────┘
```

**Design Decision — No backend server.** React talks directly to Sepolia (via ethers.js) for writes and Supabase (via JS client + PostGIS RPC) for reads and spatial queries. This eliminates a server, reduces cost to $0, and simplifies deployment.

**Dual-write pattern**: When a user registers a facility or reports emissions, the app:
1. Writes to the smart contract (immutable record, tx hash returned)
2. Writes to Supabase (fast reads, spatial queries, UI rendering)

The Supabase record includes the tx hash so anyone can verify the data on-chain via Etherscan.

---

## 3. Real Data Sources

### 3a. EPA GHGRP — Real US Facility Emissions

**Source**: EPA Greenhouse Gas Reporting Program (ghgdata.epa.gov)
- 8,000+ facilities reporting annually since 2010
- Includes: facility name, lat/lng, industry type, annual CO2e emissions, parent company
- Download: CSV from epa.gov/ghgreporting/data-sets (yearly summary spreadsheet)

**What to use**: Download the latest yearly summary CSV. Filter to 50-100 facilities across diverse US regions and industries. Use real facility names, real coordinates, real emission numbers.

**Seed data approach**: Write a Python script (`scripts/prepare_epa_data.py`) that:
1. Reads the EPA GHGRP yearly summary CSV
2. Filters to facilities with lat/lng and total CO2e > 25,000 tonnes
3. Samples 50-100 facilities across 15+ states for geographic diversity
4. Outputs `seed_data.json` with real names, coordinates, and emissions
5. Generates Supabase seed SQL

### 3b. FEMA National Risk Index — Climate Risk by County

**Source**: FEMA National Risk Index v1.20 (hazards.fema.gov/nri/data-resources)
- County-level risk scores for 18 natural hazards (flood, wildfire, hurricane, earthquake, etc.)
- Includes: Expected Annual Loss, Social Vulnerability, Community Resilience scores
- Download: CSV from OpenFEMA

**What to use**: Load county FIPS codes, risk ratings for flood, wildfire, and hurricane, plus the composite Risk Index score. For each facility, look up its county's risk profile via spatial join.

### 3c. US County/State Boundaries — Spatial Polygons

**Source**: US Census Bureau TIGER/Line shapefiles
- State and county boundary polygons as GeoJSON (~2MB simplified)

**What to use**: Load US states as `GEOGRAPHY(MULTIPOLYGON)` into Supabase for `emissions_by_state()` choropleth aggregation.

---

## 4. Smart Contract

**File**: `contracts/CarbonRegistry.sol`
**Network**: Sepolia testnet
**Framework**: Hardhat

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CarbonRegistry {

    struct Facility {
        uint256 id;
        address orgWallet;
        string orgName;
        string facilityName;
        string industryType;
        int256 latitude;           // lat * 1e6
        int256 longitude;          // lng * 1e6
        uint256 baselineEmissions; // tonnes CO2e/year
        uint256 reductionTarget;   // percentage (e.g., 20 = 20% reduction target)
        uint256 registeredAt;
        bool active;
    }

    struct EmissionReport {
        uint256 facilityId;
        uint256 co2Tonnes;
        uint256 reportedAt;
        string period;
        bool meetsTarget;
        uint256 percentChange;  // vs baseline (absolute value)
        bool isReduction;       // true if current < baseline
    }

    uint256 public facilityCount;
    mapping(uint256 => Facility) public facilities;
    mapping(uint256 => EmissionReport[]) public facilityReports;
    mapping(address => uint256[]) public orgFacilities;

    event FacilityRegistered(
        uint256 indexed facilityId,
        address indexed orgWallet,
        string orgName,
        string facilityName,
        string industryType,
        int256 lat,
        int256 lng,
        uint256 baselineEmissions,
        uint256 reductionTarget
    );

    event EmissionReported(
        uint256 indexed facilityId,
        uint256 co2Tonnes,
        string period,
        bool meetsTarget,
        uint256 percentChange,
        bool isReduction
    );

    function registerFacility(
        string calldata _orgName,
        string calldata _facilityName,
        string calldata _industryType,
        int256 _latitude,
        int256 _longitude,
        uint256 _baselineEmissions,
        uint256 _reductionTarget
    ) external returns (uint256) {
        facilityCount++;
        facilities[facilityCount] = Facility({
            id: facilityCount,
            orgWallet: msg.sender,
            orgName: _orgName,
            facilityName: _facilityName,
            industryType: _industryType,
            latitude: _latitude,
            longitude: _longitude,
            baselineEmissions: _baselineEmissions,
            reductionTarget: _reductionTarget,
            registeredAt: block.timestamp,
            active: true
        });
        orgFacilities[msg.sender].push(facilityCount);
        emit FacilityRegistered(
            facilityCount, msg.sender, _orgName, _facilityName,
            _industryType, _latitude, _longitude,
            _baselineEmissions, _reductionTarget
        );
        return facilityCount;
    }

    function reportEmissions(
        uint256 _facilityId,
        uint256 _co2Tonnes,
        string calldata _period
    ) external {
        Facility storage f = facilities[_facilityId];
        require(f.active, "Facility not active");
        require(f.orgWallet == msg.sender, "Not facility owner");

        uint256 targetEmissions = f.baselineEmissions * (100 - f.reductionTarget) / 100;
        bool meetsTarget = _co2Tonnes <= targetEmissions;

        uint256 percentChange;
        bool isReduction;
        if (_co2Tonnes <= f.baselineEmissions) {
            percentChange = ((f.baselineEmissions - _co2Tonnes) * 100) / f.baselineEmissions;
            isReduction = true;
        } else {
            percentChange = ((_co2Tonnes - f.baselineEmissions) * 100) / f.baselineEmissions;
            isReduction = false;
        }

        facilityReports[_facilityId].push(EmissionReport({
            facilityId: _facilityId,
            co2Tonnes: _co2Tonnes,
            reportedAt: block.timestamp,
            period: _period,
            meetsTarget: meetsTarget,
            percentChange: percentChange,
            isReduction: isReduction
        }));

        emit EmissionReported(_facilityId, _co2Tonnes, _period, meetsTarget, percentChange, isReduction);
    }

    function getReports(uint256 _facilityId) external view returns (EmissionReport[] memory) {
        return facilityReports[_facilityId];
    }

    function getFacility(uint256 _facilityId) external view returns (Facility memory) {
        return facilities[_facilityId];
    }

    function getOrgFacilities(address _org) external view returns (uint256[] memory) {
        return orgFacilities[_org];
    }
}
```

---

## 5. Supabase Database Schema

### Enable PostGIS
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Tables

```sql
CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    chain_facility_id INTEGER,
    org_name TEXT NOT NULL,
    facility_name TEXT NOT NULL,
    industry_type TEXT NOT NULL,
    org_wallet TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    baseline_emissions INTEGER NOT NULL,
    reduction_target INTEGER DEFAULT 20,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    epa_facility_id TEXT,
    state_code TEXT,
    county TEXT
);

CREATE INDEX idx_facilities_location ON facilities USING GIST(location);
CREATE INDEX idx_facilities_state ON facilities(state_code);
CREATE INDEX idx_facilities_industry ON facilities(industry_type);

CREATE TABLE emission_reports (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
    co2_tonnes INTEGER NOT NULL,
    period TEXT NOT NULL,
    meets_target BOOLEAN NOT NULL,
    percent_change NUMERIC(5,2),
    is_reduction BOOLEAN,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    tx_hash TEXT
);

CREATE INDEX idx_reports_facility ON emission_reports(facility_id);
CREATE INDEX idx_reports_period ON emission_reports(period);

CREATE TABLE fema_risk_index (
    id SERIAL PRIMARY KEY,
    state_name TEXT NOT NULL,
    county_name TEXT NOT NULL,
    state_fips TEXT NOT NULL,
    county_fips TEXT NOT NULL,
    risk_score NUMERIC(8,2),
    risk_rating TEXT,
    flood_risk_score NUMERIC(8,2),
    flood_risk_rating TEXT,
    wildfire_risk_score NUMERIC(8,2),
    wildfire_risk_rating TEXT,
    hurricane_risk_score NUMERIC(8,2),
    hurricane_risk_rating TEXT,
    expected_annual_loss NUMERIC(15,2),
    social_vulnerability NUMERIC(8,2),
    community_resilience NUMERIC(8,2)
);

CREATE INDEX idx_fema_county ON fema_risk_index(county_fips);
CREATE INDEX idx_fema_state ON fema_risk_index(state_fips);

CREATE TABLE us_states (
    id SERIAL PRIMARY KEY,
    state_name TEXT NOT NULL,
    state_code TEXT NOT NULL,
    state_fips TEXT NOT NULL,
    geom GEOGRAPHY(MULTIPOLYGON, 4326) NOT NULL
);

CREATE INDEX idx_states_geom ON us_states USING GIST(geom);
```

### PostGIS RPC Functions

```sql
-- 1. Find facilities within radius of a point
CREATE OR REPLACE FUNCTION nearby_facilities(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 50000
)
RETURNS TABLE (
    id INTEGER,
    org_name TEXT,
    facility_name TEXT,
    industry_type TEXT,
    baseline_emissions INTEGER,
    latest_co2 INTEGER,
    meets_target BOOLEAN,
    distance_km DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
    SELECT
        f.id,
        f.org_name,
        f.facility_name,
        f.industry_type,
        f.baseline_emissions,
        latest.co2_tonnes AS latest_co2,
        latest.meets_target,
        ROUND((ST_Distance(
            f.location,
            ST_MakePoint(lng, lat)::geography
        ) / 1000)::numeric, 2)::double precision AS distance_km,
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

-- 2. Facilities in high-risk FEMA zones
CREATE OR REPLACE FUNCTION facilities_in_risk_zones(
    risk_type TEXT DEFAULT 'flood',
    min_rating TEXT DEFAULT 'Relatively High'
)
RETURNS TABLE (
    facility_id INTEGER,
    facility_name TEXT,
    org_name TEXT,
    industry_type TEXT,
    state_code TEXT,
    county TEXT,
    risk_score NUMERIC,
    risk_rating TEXT,
    baseline_emissions INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
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
            WHEN 'flood' THEN nri.flood_risk_score
            WHEN 'wildfire' THEN nri.wildfire_risk_score
            WHEN 'hurricane' THEN nri.hurricane_risk_score
            ELSE nri.risk_score
        END AS risk_score,
        CASE risk_type
            WHEN 'flood' THEN nri.flood_risk_rating
            WHEN 'wildfire' THEN nri.wildfire_risk_rating
            WHEN 'hurricane' THEN nri.hurricane_risk_rating
            ELSE nri.risk_rating
        END AS risk_rating,
        f.baseline_emissions,
        ST_Y(f.location::geometry) AS latitude,
        ST_X(f.location::geometry) AS longitude
    FROM facilities f
    JOIN fema_risk_index nri
        ON f.state_code = nri.state_fips
        AND f.county = nri.county_name
    WHERE (
        CASE risk_type
            WHEN 'flood' THEN nri.flood_risk_rating
            WHEN 'wildfire' THEN nri.wildfire_risk_rating
            WHEN 'hurricane' THEN nri.hurricane_risk_rating
            ELSE nri.risk_rating
        END
    ) IN ('Very High', 'Relatively High')
    AND f.active = TRUE
    ORDER BY risk_score DESC;
END;
$$;

-- 3. Aggregate emissions by state (choropleth)
CREATE OR REPLACE FUNCTION emissions_by_state()
RETURNS TABLE (
    state_code TEXT,
    state_name TEXT,
    facility_count BIGINT,
    total_baseline_emissions BIGINT,
    total_latest_emissions BIGINT,
    compliant_count BIGINT,
    non_compliant_count BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        f.state_code,
        s.state_name,
        COUNT(DISTINCT f.id) AS facility_count,
        SUM(f.baseline_emissions) AS total_baseline_emissions,
        SUM(latest.co2_tonnes) AS total_latest_emissions,
        COUNT(CASE WHEN latest.meets_target = TRUE THEN 1 END) AS compliant_count,
        COUNT(CASE WHEN latest.meets_target = FALSE THEN 1 END) AS non_compliant_count
    FROM facilities f
    JOIN us_states s ON f.state_code = s.state_code
    LEFT JOIN LATERAL (
        SELECT co2_tonnes, meets_target
        FROM emission_reports er
        WHERE er.facility_id = f.id
        ORDER BY er.reported_at DESC
        LIMIT 1
    ) latest ON TRUE
    WHERE f.active = TRUE
    GROUP BY f.state_code, s.state_name
    ORDER BY total_latest_emissions DESC;
$$;

-- 4. Composite risk score for a single facility
CREATE OR REPLACE FUNCTION facility_risk_score(facility_row_id INTEGER)
RETURNS TABLE (
    facility_name TEXT,
    org_name TEXT,
    emission_compliance TEXT,
    percent_vs_baseline NUMERIC,
    flood_risk TEXT,
    wildfire_risk TEXT,
    hurricane_risk TEXT,
    composite_nri_score NUMERIC,
    overall_risk TEXT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        f.facility_name,
        f.org_name,
        CASE WHEN latest.meets_target THEN 'Compliant' ELSE 'Non-Compliant' END,
        latest.percent_change,
        COALESCE(nri.flood_risk_rating, 'Unknown'),
        COALESCE(nri.wildfire_risk_rating, 'Unknown'),
        COALESCE(nri.hurricane_risk_rating, 'Unknown'),
        COALESCE(nri.risk_score, 0),
        CASE
            WHEN latest.meets_target = FALSE AND nri.risk_score > 50 THEN 'HIGH'
            WHEN latest.meets_target = FALSE OR nri.risk_score > 50 THEN 'MEDIUM'
            ELSE 'LOW'
        END
    FROM facilities f
    LEFT JOIN LATERAL (
        SELECT meets_target, percent_change
        FROM emission_reports er
        WHERE er.facility_id = f.id
        ORDER BY er.reported_at DESC
        LIMIT 1
    ) latest ON TRUE
    LEFT JOIN fema_risk_index nri
        ON f.state_code = nri.state_fips
        AND f.county = nri.county_name
    WHERE f.id = facility_row_id;
$$;
```

---

## 6. Real Data Seed Pipeline

### Step 1: Download EPA GHGRP data
Download the yearly facility-level summary CSV from:
- `epa.gov/ghgreporting/data-sets` (yearly summary spreadsheet)
- Or export from `ghgdata.epa.gov/ghgp/main.do`

### Step 2: `scripts/prepare_epa_data.py`

```python
"""
Reads EPA GHGRP facility-level CSV and outputs:
1. seed_data.json
2. supabase/seed_facilities.sql
3. supabase/seed_reports.sql

Usage: python scripts/prepare_epa_data.py --input ghgp_data.csv
"""
import csv
import json
import random
import sys

def prepare_data(input_csv, output_dir='supabase', sample_size=50):
    facilities = []
    with open(input_csv, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            lat = row.get('LATITUDE') or row.get('latitude')
            lng = row.get('LONGITUDE') or row.get('longitude')
            emissions = row.get('GHG QUANTITY (METRIC TONS CO2e)') or row.get('total_reported_direct_emissions')
            if lat and lng and emissions:
                try:
                    facilities.append({
                        'epa_facility_id': row.get('FACILITY ID', ''),
                        'facility_name': row.get('FACILITY NAME', 'Unknown'),
                        'org_name': row.get('PARENT COMPANIES', row.get('REPORTING NAME', 'Unknown')),
                        'industry_type': row.get('INDUSTRY TYPE', 'General'),
                        'lat': float(lat),
                        'lng': float(lng),
                        'baseline_emissions': int(float(emissions)),
                        'state': row.get('STATE', ''),
                        'county': row.get('COUNTY', ''),
                        'state_fips': row.get('STATE FIPS CODE', ''),
                    })
                except (ValueError, TypeError):
                    continue

    # Sample across states for geographic diversity
    by_state = {}
    for f in facilities:
        by_state.setdefault(f['state'], []).append(f)

    sampled = []
    per_state = max(1, sample_size // len(by_state))
    for st in sorted(by_state):
        sampled.extend(random.sample(by_state[st], min(per_state, len(by_state[st]))))
    sampled = sampled[:sample_size]

    def esc(s):
        return s.replace("'", "''")

    sql_f, sql_r = [], []
    for i, f in enumerate(sampled, 1):
        sql_f.append(
            f"INSERT INTO facilities (org_name, facility_name, industry_type, location, "
            f"baseline_emissions, reduction_target, epa_facility_id, state_code, county) VALUES ("
            f"'{esc(f['org_name'])}', '{esc(f['facility_name'])}', '{esc(f['industry_type'])}', "
            f"ST_MakePoint({f['lng']}, {f['lat']})::geography, "
            f"{f['baseline_emissions']}, 20, '{f['epa_facility_id']}', "
            f"'{f['state_fips']}', '{esc(f['county'])}');"
        )
        for year in ['2021', '2022', '2023']:
            variance = random.uniform(-0.15, 0.10)
            co2 = int(f['baseline_emissions'] * (1 + variance))
            target = int(f['baseline_emissions'] * 0.80)
            meets = co2 <= target
            pct = abs(round((co2 - f['baseline_emissions']) / f['baseline_emissions'] * 100, 2))
            is_red = co2 < f['baseline_emissions']
            sql_r.append(
                f"INSERT INTO emission_reports (facility_id, co2_tonnes, period, "
                f"meets_target, percent_change, is_reduction) VALUES "
                f"({i}, {co2}, '{year}', {str(meets).lower()}, {pct}, {str(is_red).lower()});"
            )

    with open(f'{output_dir}/seed_facilities.sql', 'w') as f:
        f.write('\n'.join(sql_f))
    with open(f'{output_dir}/seed_reports.sql', 'w') as f:
        f.write('\n'.join(sql_r))
    with open('seed_data.json', 'w') as f:
        json.dump(sampled, f, indent=2)

    print(f"Generated {len(sampled)} facilities, {len(sql_r)} reports")

if __name__ == '__main__':
    prepare_data(sys.argv[1] if len(sys.argv) > 1 else 'ghgp_data.csv')
```

### Step 3: Fallback seed data
If EPA CSV parsing is not available, use the 15 realistic facilities below as fallback. The schema fully supports real EPA data — it can be swapped in at any time.

```json
[
  {"orgName":"SunVolt Energy","facilityName":"Nevada Solar Farm","lat":36.1699,"lng":-115.1398,"baselineEmissions":500,"state":"NV","county":"Clark","reports":[{"co2Tonnes":420,"period":"2022"},{"co2Tonnes":380,"period":"2023"}]},
  {"orgName":"SunVolt Energy","facilityName":"Arizona Processing Plant","lat":33.4484,"lng":-112.0740,"baselineEmissions":800,"state":"AZ","county":"Maricopa","reports":[{"co2Tonnes":850,"period":"2022"},{"co2Tonnes":900,"period":"2023"}]},
  {"orgName":"WindStream Corp","facilityName":"Texas Wind Farm","lat":31.9686,"lng":-99.9018,"baselineEmissions":300,"state":"TX","county":"Coleman","reports":[{"co2Tonnes":250,"period":"2023"}]},
  {"orgName":"WindStream Corp","facilityName":"Oklahoma Turbine Facility","lat":35.4676,"lng":-97.5164,"baselineEmissions":450,"state":"OK","county":"Oklahoma","reports":[{"co2Tonnes":470,"period":"2023"}]},
  {"orgName":"GreenGrid Industries","facilityName":"California Battery Storage","lat":34.0522,"lng":-118.2437,"baselineEmissions":600,"state":"CA","county":"Los Angeles","reports":[{"co2Tonnes":550,"period":"2022"},{"co2Tonnes":520,"period":"2023"}]},
  {"orgName":"GreenGrid Industries","facilityName":"Oregon Hydropower Station","lat":45.5152,"lng":-122.6784,"baselineEmissions":200,"state":"OR","county":"Multnomah","reports":[{"co2Tonnes":180,"period":"2023"}]},
  {"orgName":"EcoForge LLC","facilityName":"New York Data Center","lat":40.7128,"lng":-74.0060,"baselineEmissions":1200,"state":"NY","county":"New York","reports":[{"co2Tonnes":1350,"period":"2022"},{"co2Tonnes":1400,"period":"2023"}]},
  {"orgName":"EcoForge LLC","facilityName":"New Jersey Manufacturing","lat":40.0583,"lng":-74.4057,"baselineEmissions":900,"state":"NJ","county":"Burlington","reports":[{"co2Tonnes":870,"period":"2023"}]},
  {"orgName":"CleanArc Energy","facilityName":"Florida Solar Array","lat":25.7617,"lng":-80.1918,"baselineEmissions":350,"state":"FL","county":"Miami-Dade","reports":[{"co2Tonnes":310,"period":"2023"}]},
  {"orgName":"CleanArc Energy","facilityName":"Georgia Biomass Plant","lat":33.7490,"lng":-84.3880,"baselineEmissions":700,"state":"GA","county":"Fulton","reports":[{"co2Tonnes":750,"period":"2022"},{"co2Tonnes":780,"period":"2023"}]},
  {"orgName":"NorthStar Renewables","facilityName":"Michigan Wind Farm","lat":42.3314,"lng":-83.0458,"baselineEmissions":400,"state":"MI","county":"Wayne","reports":[{"co2Tonnes":360,"period":"2023"}]},
  {"orgName":"NorthStar Renewables","facilityName":"Minnesota Solar Park","lat":44.9778,"lng":-93.2650,"baselineEmissions":280,"state":"MN","county":"Hennepin","reports":[{"co2Tonnes":290,"period":"2023"}]},
  {"orgName":"TerraVerde Solutions","facilityName":"Colorado EV Battery Factory","lat":39.7392,"lng":-104.9903,"baselineEmissions":950,"state":"CO","county":"Denver","reports":[{"co2Tonnes":880,"period":"2022"},{"co2Tonnes":820,"period":"2023"}]},
  {"orgName":"TerraVerde Solutions","facilityName":"Utah Lithium Processing","lat":40.7608,"lng":-111.8910,"baselineEmissions":1100,"state":"UT","county":"Salt Lake","reports":[{"co2Tonnes":1150,"period":"2023"}]},
  {"orgName":"PacificClean Energy","facilityName":"Washington Hydro Station","lat":47.6062,"lng":-122.3321,"baselineEmissions":150,"state":"WA","county":"King","reports":[{"co2Tonnes":120,"period":"2022"},{"co2Tonnes":110,"period":"2023"}]}
]
```

---

## 7. Frontend Pages & Components

### Page 1: Dashboard (Main Map View)

**Layout**: Full-width Google Map + collapsible left sidebar

**Map features**:
- All facilities as markers, color-coded:
  - Green = compliant (latest emissions below reduction target)
  - Yellow = improving (below baseline but above target)
  - Red = non-compliant (above baseline)
  - Gray = no reports yet
- Marker size scales with emission volume
- Click marker → popup: facility name, org, industry, baseline vs latest, compliance badge, "View Details" link
- **State choropleth overlay** (toggle): states shaded by total emissions via `emissions_by_state()` RPC
- **FEMA risk layer** (toggle): pulsing border on facilities in flood/wildfire/hurricane zones via `facilities_in_risk_zones()` RPC

**Sidebar**:
- Summary cards: Total Facilities, Compliant %, Total CO2 Reported, Avg Reduction %
- Filters: industry type dropdown, compliance status, risk zone (Flood/Wildfire/Hurricane), "Near me" geolocation button, org name search

### Page 2: Register Facility

**Form**:
- Organization name, facility name, industry type dropdown
- Baseline emissions (tonnes CO2e/year), reduction target (slider, 5-50%, default 20%)
- Location: click-to-place on Google Maps OR manual lat/lng — reverse geocode auto-fills state/county
- "Register on Blockchain" → MetaMask → `registerFacility()` → dual-write to Supabase with tx hash
- Loading state with Sepolia Etherscan link, success redirect to dashboard

### Page 3: Report Emissions

**Form**:
- Select facility (dropdown filtered by connected wallet)
- Reporting period (dropdown: 2021, 2022, 2023, 2024)
- CO2 tonnes (number input)
- Auto-calculated preview: "X% [above/below] baseline of Y tonnes. Target: Z tonnes. Status: [Compliant/Non-compliant]"
- "Submit on Blockchain" → MetaMask → `reportEmissions()` → dual-write to Supabase
- Success: green checkmark or red warning with explanation

### Page 4: Facility Detail

**Accessed via**: map marker popup → "View Details", or `/facility/:id`

**Content**:
- Header: facility name, org, industry badge, compliance status badge
- Location: state, county, coordinates, mini-map
- **Risk Assessment Panel**: flood/wildfire/hurricane ratings from FEMA NRI, composite risk score via `facility_risk_score()` RPC, color-coded badges
- **Emission History Chart** (Recharts BarChart): bars per period, baseline line, target line, bars colored green/yellow/red
- **On-Chain Verification Table**: period, CO2, status, tx hash linked to Etherscan
- **Nearby Facilities**: facilities within 50km via `nearby_facilities()` RPC

### Global Components

- **Navbar**: Logo, Dashboard, Register, Report, Connect Wallet
- **WalletConnect**: MetaMask via ethers.js BrowserProvider, truncated address, network check (Sepolia only), disconnect
- **Toast**: react-hot-toast for tx pending/success/failure
- **Loading skeletons** while Supabase data loads
- **Footer**: "Data sourced from EPA GHGRP. Risk data from FEMA NRI. On-chain records verifiable on Sepolia Etherscan."

---

## 8. Project Structure

```
carbonchain/
├── contracts/
│   └── CarbonRegistry.sol
├── hardhat.config.js
├── scripts/
│   ├── deploy.js
│   └── prepare_epa_data.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── FacilityMarker.jsx
│   │   │   ├── StateChoropleth.jsx
│   │   │   ├── RiskOverlay.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── ReportForm.jsx
│   │   │   ├── FacilityDetail.jsx
│   │   │   ├── EmissionChart.jsx
│   │   │   ├── RiskPanel.jsx
│   │   │   ├── OnChainTable.jsx
│   │   │   ├── NearbyFacilities.jsx
│   │   │   ├── WalletConnect.jsx
│   │   │   └── Toast.jsx
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   ├── contract.js
│   │   │   └── constants.js
│   │   ├── hooks/
│   │   │   ├── useWallet.js
│   │   │   ├── useFacilities.js
│   │   │   ├── useContract.js
│   │   │   └── useRiskData.js
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── Register.jsx
│   │       ├── Report.jsx
│   │       └── FacilityPage.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
├── supabase/
│   ├── schema.sql
│   ├── rpc_functions.sql
│   ├── seed_facilities.sql
│   ├── seed_reports.sql
│   ├── seed_fema_nri.sql
│   └── seed_us_states.sql
├── data/
│   ├── ghgp_data.csv          # EPA GHGRP download (gitignored)
│   ├── nri_county.csv         # FEMA NRI download (gitignored)
│   └── us_states.geojson      # Simplified US state boundaries
├── seed_data.json
├── .env
├── package.json
└── README.md
```

---

## 9. Environment Variables

**Root `.env` (Hardhat)**:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=your_sepolia_wallet_private_key
```

**`frontend/.env`**:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_CONTRACT_ADDRESS=0x_deployed_contract_address
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_CHAIN_ID=11155111
VITE_ETHERSCAN_URL=https://sepolia.etherscan.io
```

---

## 10. Dependencies

**Hardhat (root `package.json`)**:
```json
{
  "devDependencies": {
    "hardhat": "^2.22.0",
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "dotenv": "^16.4.0"
  }
}
```

**Frontend (`frontend/package.json`)**:
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "@supabase/supabase-js": "^2.45.0",
    "ethers": "^6.13.0",
    "@react-google-maps/api": "^2.19.0",
    "recharts": "^2.12.0",
    "react-hot-toast": "^2.4.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 11. Deployment

1. **Supabase**: Create project → SQL Editor → `schema.sql` → `rpc_functions.sql` → seed files
2. **Smart Contract**: `npx hardhat run scripts/deploy.js --network sepolia` → copy address to frontend `.env`
3. **Frontend**: `cd frontend && npm install && npm run build` → deploy `dist/` to Netlify
4. **Total deploy time**: ~30 minutes, $0 cost

---

## 12. Build Order

1. Initialize Hardhat, write `CarbonRegistry.sol`, compile, deploy to Sepolia
2. Set up Supabase: schema SQL, enable PostGIS, create RPC functions
3. Run `prepare_epa_data.py` to generate seed data (or use fallback), insert into Supabase
4. Load FEMA NRI county data into `fema_risk_index` table
5. Scaffold React + Vite + Tailwind frontend with React Router
6. Build `WalletConnect` (MetaMask via ethers.js)
7. Build `MapView` with Google Maps, sized/colored facility markers
8. Build `StateChoropleth` using `emissions_by_state()` RPC + state polygons
9. Build `RiskOverlay` using `facilities_in_risk_zones()` RPC
10. Build `Sidebar` with stats, filters, and proximity search
11. Build `RegisterForm` with map click-to-place + dual-write
12. Build `ReportForm` with compliance preview + dual-write
13. Build `FacilityDetail`: emission chart, risk panel, on-chain table, nearby list
14. Add toast notifications, loading states, error handling
15. Test end-to-end: register → report → map updates → Etherscan verification
16. Deploy to Netlify
17. Write README with architecture diagram, screenshots, data source credits

---

## 13. GIS Depth Summary

| Feature | GIS Level |
|---|---|
| Facility markers on Google Maps | Basic — visualization |
| `ST_DWithin()` proximity search | Intermediate — spatial query |
| `GEOGRAPHY(POINT)` with GIST index | Intermediate — spatial indexing |
| State choropleth via polygon aggregation | Intermediate — spatial aggregation |
| FEMA NRI spatial join (county → risk zone) | Advanced — spatial join with external dataset |
| Composite risk score (emissions + geospatial) | Advanced — multi-factor spatial analysis |
| Reverse geocoding on facility registration | Intermediate — geocoding |

---

## 14. References

- Cornell CATchain-R: Blockchain-based carbon registry with MRV framework (npj Climate Action, Feb 2026)
- EU Blockchain for Climate Action: Smart contracts for carbon footprint tracking (digital-strategy.ec.europa.eu)
- AB-CELS: AI + Blockchain carbon emissions ledger for construction (ScienceDirect, 2025)
- EPA GHGRP: 8,000+ facility-level emissions, public download (epa.gov/ghgreporting)
- FEMA NRI v1.20: County-level risk scores for 18 natural hazards (hazards.fema.gov/nri)
- ISO 14064: International standard for GHG accounting and verification

---

## 15. Success Criteria

- [ ] Smart contract deployed on Sepolia with verified source code
- [ ] 50+ real EPA-sourced facilities visible on map with correct color coding
- [ ] State choropleth shows emission aggregation by state
- [ ] FEMA risk overlay highlights facilities in flood/wildfire/hurricane zones
- [ ] `nearby_facilities()` returns results with correct distances
- [ ] `facilities_in_risk_zones()` correctly joins facility locations with FEMA NRI data
- [ ] `facility_risk_score()` returns composite risk combining emissions + FEMA data
- [ ] Can register a new facility via MetaMask and see it appear on map
- [ ] Can submit emission report and see compliance status + chart update
- [ ] On-chain tx hashes link to Sepolia Etherscan for verification
- [ ] Deployed on Netlify, accessible via public URL
- [ ] README with architecture diagram, screenshots, data source credits, and setup instructions
