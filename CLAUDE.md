# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project

**CarbonChain** — Decentralized carbon footprint reporting platform. Organizations register facilities on Sepolia, submit quarterly emission reports immutably on-chain, and the frontend visualizes compliance using Google Maps + PostGIS spatial queries.

Full spec: `spec.md`

---

## Commands

### Smart Contract (Hardhat — run from repo root)

```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deploy.js --network hardhat   # local node
npx hardhat node                                       # local testnet
```

### Frontend (run from `frontend/`)

```bash
npm install
npm run dev        # Vite dev server at localhost:5173
npm run build      # output → frontend/dist/
npm run preview    # preview production build locally
```

### Data Seed Pipeline (Python — run from repo root)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r scripts/requirements.txt
python scripts/prepare_epa_data.py ghgp_data.csv   # generates supabase/seed_*.sql
```

---

## Architecture

### Data flow (dual-write)

All writes go to **both** the Sepolia smart contract and Supabase:
1. Frontend calls MetaMask → ethers.js → `CarbonRegistry.sol` → gets tx hash
2. Frontend writes same record to Supabase with the tx hash for Etherscan verification

Reads always come from **Supabase** (fast, spatial). The chain is the source of truth; Supabase is the read cache.

### Smart contract (`contracts/CarbonRegistry.sol`)

Two structs: `Facility` (registered once, immutable owner) and `EmissionReport` (appended per period). Key mappings:
- `facilities[id]` — facility by chain ID
- `facilityReports[id]` — array of all reports for a facility
- `orgFacilities[wallet]` — all facility IDs owned by a wallet

`meetsTarget` is auto-calculated on-chain: `co2Tonnes <= baselineEmissions * (100 - reductionTarget) / 100`.

### Supabase schema

Four tables: `facilities`, `emission_reports`, `fema_risk_index`, `us_states`. The `facilities.location` column is `GEOGRAPHY(POINT, 4326)` with a GIST index. The `us_states.geom` column is `GEOGRAPHY(MULTIPOLYGON, 4326)`.

Four PostGIS RPC functions callable from the Supabase JS client:
- `nearby_facilities(lat, lng, radius_meters)` — `ST_DWithin` proximity search
- `facilities_in_risk_zones(risk_type, min_rating)` — joins `facilities` to `fema_risk_index` on `state_code + county`
- `emissions_by_state()` — aggregates per state for choropleth; joins to `us_states`
- `facility_risk_score(facility_row_id)` — composite: emission compliance + FEMA NRI score

FEMA risk join key: `facilities.state_code = fema_risk_index.state_fips AND facilities.county = fema_risk_index.county_name`.

### Frontend (`frontend/src/`)

- `lib/supabase.js` — Supabase client (reads + RPC calls)
- `lib/contract.js` — ethers.js contract instance + ABI
- `hooks/useWallet.js` — MetaMask connection, network enforcement (Sepolia only, chain ID 11155111)
- `hooks/useContract.js` — wraps `registerFacility()` and `reportEmissions()` with dual-write logic
- `hooks/useFacilities.js` — fetches all facilities + latest reports from Supabase
- `hooks/useRiskData.js` — calls `facilities_in_risk_zones()` and `facility_risk_score()`

Map layers (togglable):
1. Facility markers — colored green/yellow/red/gray by compliance status, sized by emission volume
2. State choropleth — `emissions_by_state()` RPC, rendered as GeoJSON overlay
3. FEMA risk overlay — pulsing border on facilities returned by `facilities_in_risk_zones()`

### Compliance color logic

- **Green**: latest `co2_tonnes <= baseline * (1 - reductionTarget/100)` (meets target)
- **Yellow**: latest `co2_tonnes <= baseline` but above target (improving, not compliant)
- **Red**: latest `co2_tonnes > baseline` (non-compliant)
- **Gray**: no reports yet

---

## Key Constants

| Variable | Where |
|---|---|
| Sepolia chain ID | `11155111` |
| Contract address | `VITE_CONTRACT_ADDRESS` in `frontend/.env` |
| Etherscan base URL | `https://sepolia.etherscan.io/tx/<hash>` |
| Supabase anon key | `VITE_SUPABASE_ANON_KEY` in `frontend/.env` |
| Hardhat network name | `sepolia` (configured in `hardhat.config.js`) |

---

## Real Data Sources

- **EPA GHGRP CSV**: download from `epa.gov/ghgreporting/data-sets` → place at `data/ghgp_data.csv` → run `prepare_epa_data.py` to generate seed SQL
- **FEMA NRI CSV**: download from `hazards.fema.gov/nri/data-resources` → place at `data/nri_county.csv`
- **US States GeoJSON**: simplified polygons at `data/us_states.geojson`
- `data/` is gitignored; fallback seed data is embedded in `spec.md` (15 facilities)

---

## Supabase Setup Order

1. Enable PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`
2. Run `supabase/schema.sql`
3. Run `supabase/rpc_functions.sql`
4. Run seed files: `seed_facilities.sql` → `seed_reports.sql` → `seed_fema_nri.sql` → `seed_us_states.sql`

RPC functions must be re-created (not altered) if signature changes — Supabase does not support `ALTER FUNCTION` for return type changes.
