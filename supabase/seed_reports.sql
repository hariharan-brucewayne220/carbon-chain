-- Emission reports for the 15 fallback seed facilities (ids 1-15).
-- 3 years of data per facility. meets_target = co2_tonnes <= baseline * 0.80 (20% target).
-- Non-compliant facilities: 2 (AZ plant), 4 (OK), 7 (NY DC), 10 (GA biomass), 14 (UT lithium)

-- 1: Nevada Solar Farm (baseline 500, target 400)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (1, 470, '2021', FALSE, 6,  TRUE),
    (1, 420, '2022', FALSE, 16, TRUE),
    (1, 380, '2023', TRUE,  24, TRUE);

-- 2: Arizona Processing Plant (baseline 800, target 640) — non-compliant
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (2, 820, '2021', FALSE, 3,  FALSE),
    (2, 850, '2022', FALSE, 6,  FALSE),
    (2, 900, '2023', FALSE, 13, FALSE);

-- 3: Texas Wind Farm (baseline 300, target 240)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (3, 280, '2021', FALSE, 7,  TRUE),
    (3, 260, '2022', FALSE, 13, TRUE),
    (3, 220, '2023', TRUE,  27, TRUE);

-- 4: Oklahoma Turbine Facility (baseline 450, target 360) — non-compliant
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (4, 460, '2021', FALSE, 2,  FALSE),
    (4, 470, '2022', FALSE, 4,  FALSE),
    (4, 480, '2023', FALSE, 7,  FALSE);

-- 5: California Battery Storage (baseline 600, target 480)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (5, 570, '2021', FALSE, 5,  TRUE),
    (5, 520, '2022', FALSE, 13, TRUE),
    (5, 460, '2023', TRUE,  23, TRUE);

-- 6: Oregon Hydropower Station (baseline 200, target 160)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (6, 190, '2021', FALSE, 5,  TRUE),
    (6, 175, '2022', FALSE, 13, TRUE),
    (6, 150, '2023', TRUE,  25, TRUE);

-- 7: New York Data Center (baseline 1200, target 960) — non-compliant
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (7, 1300, '2021', FALSE, 8,  FALSE),
    (7, 1350, '2022', FALSE, 13, FALSE),
    (7, 1400, '2023', FALSE, 17, FALSE);

-- 8: New Jersey Manufacturing (baseline 900, target 720)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (8, 880, '2021', FALSE, 2,  TRUE),
    (8, 840, '2022', FALSE, 7,  TRUE),
    (8, 700, '2023', TRUE,  22, TRUE);

-- 9: Florida Solar Array (baseline 350, target 280)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (9, 340, '2021', FALSE, 3,  TRUE),
    (9, 310, '2022', FALSE, 11, TRUE),
    (9, 270, '2023', TRUE,  23, TRUE);

-- 10: Georgia Biomass Plant (baseline 700, target 560) — non-compliant
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (10, 720, '2021', FALSE, 3,  FALSE),
    (10, 750, '2022', FALSE, 7,  FALSE),
    (10, 780, '2023', FALSE, 11, FALSE);

-- 11: Michigan Wind Farm (baseline 400, target 320)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (11, 390, '2021', FALSE, 3,  TRUE),
    (11, 360, '2022', FALSE, 10, TRUE),
    (11, 310, '2023', TRUE,  23, TRUE);

-- 12: Minnesota Solar Park (baseline 280, target 224)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (12, 275, '2021', FALSE, 2,  TRUE),
    (12, 260, '2022', FALSE, 7,  TRUE),
    (12, 220, '2023', TRUE,  21, TRUE);

-- 13: Colorado EV Battery Factory (baseline 950, target 760)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (13, 930, '2021', FALSE, 2,  TRUE),
    (13, 880, '2022', FALSE, 7,  TRUE),
    (13, 750, '2023', TRUE,  21, TRUE);

-- 14: Utah Lithium Processing (baseline 1100, target 880) — non-compliant
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (14, 1120, '2021', FALSE, 2,  FALSE),
    (14, 1150, '2022', FALSE, 5,  FALSE),
    (14, 1180, '2023', FALSE, 7,  FALSE);

-- 15: Washington Hydro Station (baseline 150, target 120)
INSERT INTO emission_reports (facility_id, co2_tonnes, period, meets_target, percent_change, is_reduction)
VALUES
    (15, 140, '2021', FALSE, 7,  TRUE),
    (15, 125, '2022', FALSE, 17, TRUE),
    (15, 105, '2023', TRUE,  30, TRUE);
