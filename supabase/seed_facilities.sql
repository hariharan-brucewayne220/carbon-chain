-- Fallback seed: 15 facilities covering 13 states.
-- Replace with EPA GHGRP output from scripts/prepare_epa_data.py for real data.
-- state_code uses 2-digit FIPS (06=CA, 32=NV, 04=AZ, 48=TX, 40=OK, 41=OR,
--   36=NY, 34=NJ, 12=FL, 13=GA, 26=MI, 27=MN, 08=CO, 49=UT, 53=WA)

INSERT INTO facilities
    (org_name, facility_name, industry_type, location, baseline_emissions,
     reduction_target, state_code, county)
VALUES
    ('SunVolt Energy',       'Nevada Solar Farm',           'Power Plants',
     ST_MakePoint(-115.1398, 36.1699)::geography,  500,  20, '32', 'Clark'),
    ('SunVolt Energy',       'Arizona Processing Plant',    'Petroleum Refining',
     ST_MakePoint(-112.0740, 33.4484)::geography,  800,  20, '04', 'Maricopa'),
    ('WindStream Corp',      'Texas Wind Farm',             'Power Plants',
     ST_MakePoint(-99.9018,  31.9686)::geography,  300,  20, '48', 'Coleman'),
    ('WindStream Corp',      'Oklahoma Turbine Facility',   'Power Plants',
     ST_MakePoint(-97.5164,  35.4676)::geography,  450,  20, '40', 'Oklahoma'),
    ('GreenGrid Industries', 'California Battery Storage',  'Electrical Equipment',
     ST_MakePoint(-118.2437, 34.0522)::geography,  600,  20, '06', 'Los Angeles'),
    ('GreenGrid Industries', 'Oregon Hydropower Station',   'Power Plants',
     ST_MakePoint(-122.6784, 45.5152)::geography,  200,  20, '41', 'Multnomah'),
    ('EcoForge LLC',         'New York Data Center',        'Other',
     ST_MakePoint(-74.0060,  40.7128)::geography, 1200,  20, '36', 'New York'),
    ('EcoForge LLC',         'New Jersey Manufacturing',    'Chemicals',
     ST_MakePoint(-74.4057,  40.0583)::geography,  900,  20, '34', 'Burlington'),
    ('CleanArc Energy',      'Florida Solar Array',         'Power Plants',
     ST_MakePoint(-80.1918,  25.7617)::geography,  350,  20, '12', 'Miami-Dade'),
    ('CleanArc Energy',      'Georgia Biomass Plant',       'Pulp and Paper',
     ST_MakePoint(-84.3880,  33.7490)::geography,  700,  20, '13', 'Fulton'),
    ('NorthStar Renewables', 'Michigan Wind Farm',          'Power Plants',
     ST_MakePoint(-83.0458,  42.3314)::geography,  400,  20, '26', 'Wayne'),
    ('NorthStar Renewables', 'Minnesota Solar Park',        'Power Plants',
     ST_MakePoint(-93.2650,  44.9778)::geography,  280,  20, '27', 'Hennepin'),
    ('TerraVerde Solutions', 'Colorado EV Battery Factory', 'Metals',
     ST_MakePoint(-104.9903, 39.7392)::geography,  950,  20, '08', 'Denver'),
    ('TerraVerde Solutions', 'Utah Lithium Processing',     'Minerals',
     ST_MakePoint(-111.8910, 40.7608)::geography, 1100,  20, '49', 'Salt Lake'),
    ('PacificClean Energy',  'Washington Hydro Station',    'Power Plants',
     ST_MakePoint(-122.3321, 47.6062)::geography,  150,  20, '53', 'King');
