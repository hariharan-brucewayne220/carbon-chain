// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CarbonRegistry {

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Facility {
        uint256 id;
        address orgWallet;
        string orgName;
        string facilityName;
        string industryType;
        int256 latitude;           // lat * 1e6 (e.g. 36.1699 → 36169900)
        int256 longitude;          // lng * 1e6
        uint256 baselineEmissions; // tonnes CO2e/year
        uint256 reductionTarget;   // percentage (e.g. 20 = 20%)
        uint256 registeredAt;
        bool active;
    }

    struct EmissionReport {
        uint256 facilityId;
        uint256 co2Tonnes;
        uint256 reportedAt;
        string period;           // "2023", "2024-Q1", etc.
        bool meetsTarget;        // co2Tonnes <= baseline * (100 - target) / 100
        uint256 percentChange;   // absolute % vs baseline
        bool isReduction;        // true when co2Tonnes <= baseline
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public facilityCount;
    mapping(uint256 => Facility) public facilities;
    mapping(uint256 => EmissionReport[]) public facilityReports;
    mapping(address => uint256[]) public orgFacilities;

    // ─── Events ───────────────────────────────────────────────────────────────

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

    // ─── Functions ────────────────────────────────────────────────────────────

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
            facilityCount,
            msg.sender,
            _orgName,
            _facilityName,
            _industryType,
            _latitude,
            _longitude,
            _baselineEmissions,
            _reductionTarget
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
            percentChange = (f.baselineEmissions - _co2Tonnes) * 100 / f.baselineEmissions;
            isReduction = true;
        } else {
            percentChange = (_co2Tonnes - f.baselineEmissions) * 100 / f.baselineEmissions;
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

        emit EmissionReported(
            _facilityId,
            _co2Tonnes,
            _period,
            meetsTarget,
            percentChange,
            isReduction
        );
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
