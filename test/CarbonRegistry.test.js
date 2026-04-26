const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonRegistry", function () {
  let registry;
  let owner, org1, org2, stranger;

  const FACILITY_1 = {
    orgName: "SunVolt Energy",
    facilityName: "Nevada Solar Farm",
    industryType: "Power Plants",
    latitude: 36169900n,    // 36.1699 * 1e6
    longitude: -115139800n, // -115.1398 * 1e6
    baselineEmissions: 500n,
    reductionTarget: 20n,   // 20% → targetEmissions = 400
  };

  const FACILITY_2 = {
    orgName: "EcoForge LLC",
    facilityName: "New York Data Center",
    industryType: "Data Centers",
    latitude: 40712800n,
    longitude: -74006000n,
    baselineEmissions: 1200n,
    reductionTarget: 15n,
  };

  beforeEach(async function () {
    [owner, org1, org2, stranger] = await ethers.getSigners();
    const CarbonRegistry = await ethers.getContractFactory("CarbonRegistry");
    registry = await CarbonRegistry.deploy();
  });

  // ─── registerFacility ────────────────────────────────────────────────────

  describe("registerFacility", function () {
    it("starts with facilityCount = 0", async function () {
      expect(await registry.facilityCount()).to.equal(0n);
    });

    it("increments facilityCount on registration", async function () {
      await registry.connect(org1).registerFacility(
        FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
        FACILITY_1.latitude, FACILITY_1.longitude,
        FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
      );
      expect(await registry.facilityCount()).to.equal(1n);
    });

    it("returns the new facilityId via emitted event", async function () {
      const tx = await registry.connect(org1).registerFacility(
        FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
        FACILITY_1.latitude, FACILITY_1.longitude,
        FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "FacilityRegistered"
      );
      expect(event.args.facilityId).to.equal(1n);
    });

    it("stores all facility fields correctly", async function () {
      await registry.connect(org1).registerFacility(
        FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
        FACILITY_1.latitude, FACILITY_1.longitude,
        FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
      );
      const f = await registry.getFacility(1n);
      expect(f.orgWallet).to.equal(org1.address);
      expect(f.orgName).to.equal(FACILITY_1.orgName);
      expect(f.facilityName).to.equal(FACILITY_1.facilityName);
      expect(f.industryType).to.equal(FACILITY_1.industryType);
      expect(f.latitude).to.equal(FACILITY_1.latitude);
      expect(f.longitude).to.equal(FACILITY_1.longitude);
      expect(f.baselineEmissions).to.equal(FACILITY_1.baselineEmissions);
      expect(f.reductionTarget).to.equal(FACILITY_1.reductionTarget);
      expect(f.active).to.equal(true);
    });

    it("emits FacilityRegistered event with correct args", async function () {
      await expect(
        registry.connect(org1).registerFacility(
          FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
          FACILITY_1.latitude, FACILITY_1.longitude,
          FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
        )
      )
        .to.emit(registry, "FacilityRegistered")
        .withArgs(
          1n, org1.address,
          FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
          FACILITY_1.latitude, FACILITY_1.longitude,
          FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
        );
    });

    it("tracks facility IDs per wallet via getOrgFacilities", async function () {
      await registry.connect(org1).registerFacility(
        FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
        FACILITY_1.latitude, FACILITY_1.longitude,
        FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
      );
      await registry.connect(org1).registerFacility(
        FACILITY_2.orgName, FACILITY_2.facilityName, FACILITY_2.industryType,
        FACILITY_2.latitude, FACILITY_2.longitude,
        FACILITY_2.baselineEmissions, FACILITY_2.reductionTarget
      );
      const ids = await registry.getOrgFacilities(org1.address);
      expect(ids).to.deep.equal([1n, 2n]);
    });

    it("different wallets have independent facility lists", async function () {
      await registry.connect(org1).registerFacility(
        FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
        FACILITY_1.latitude, FACILITY_1.longitude,
        FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
      );
      await registry.connect(org2).registerFacility(
        FACILITY_2.orgName, FACILITY_2.facilityName, FACILITY_2.industryType,
        FACILITY_2.latitude, FACILITY_2.longitude,
        FACILITY_2.baselineEmissions, FACILITY_2.reductionTarget
      );
      expect(await registry.getOrgFacilities(org1.address)).to.deep.equal([1n]);
      expect(await registry.getOrgFacilities(org2.address)).to.deep.equal([2n]);
    });

    it("IDs are assigned sequentially across wallets", async function () {
      await registry.connect(org1).registerFacility(
        FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
        FACILITY_1.latitude, FACILITY_1.longitude,
        FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
      );
      await registry.connect(org2).registerFacility(
        FACILITY_2.orgName, FACILITY_2.facilityName, FACILITY_2.industryType,
        FACILITY_2.latitude, FACILITY_2.longitude,
        FACILITY_2.baselineEmissions, FACILITY_2.reductionTarget
      );
      expect(await registry.facilityCount()).to.equal(2n);
      const f2 = await registry.getFacility(2n);
      expect(f2.orgWallet).to.equal(org2.address);
    });
  });

  // ─── reportEmissions ─────────────────────────────────────────────────────

  describe("reportEmissions", function () {
    beforeEach(async function () {
      // facility 1: baseline=500, reductionTarget=20% → targetEmissions=400
      await registry.connect(org1).registerFacility(
        FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
        FACILITY_1.latitude, FACILITY_1.longitude,
        FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
      );
    });

    it("reverts when facility does not exist", async function () {
      await expect(
        registry.connect(org1).reportEmissions(99n, 400n, "2023")
      ).to.be.revertedWith("Facility not active");
    });

    it("reverts when caller is not the facility owner", async function () {
      await expect(
        registry.connect(stranger).reportEmissions(1n, 400n, "2023")
      ).to.be.revertedWith("Not facility owner");
    });

    it("marks meetsTarget=true when co2 == targetEmissions (400)", async function () {
      await registry.connect(org1).reportEmissions(1n, 400n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports[0].meetsTarget).to.equal(true);
    });

    it("marks meetsTarget=true when co2 < targetEmissions", async function () {
      await registry.connect(org1).reportEmissions(1n, 300n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports[0].meetsTarget).to.equal(true);
    });

    it("marks meetsTarget=false when co2 > targetEmissions (401 > 400)", async function () {
      await registry.connect(org1).reportEmissions(1n, 401n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports[0].meetsTarget).to.equal(false);
    });

    it("calculates isReduction=true and percentChange=20 when co2=400 vs baseline=500", async function () {
      await registry.connect(org1).reportEmissions(1n, 400n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports[0].isReduction).to.equal(true);
      expect(reports[0].percentChange).to.equal(20n);
    });

    it("calculates isReduction=false and percentChange=20 when co2=600 vs baseline=500", async function () {
      await registry.connect(org1).reportEmissions(1n, 600n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports[0].isReduction).to.equal(false);
      expect(reports[0].percentChange).to.equal(20n);
    });

    it("stores all report fields correctly", async function () {
      await registry.connect(org1).reportEmissions(1n, 380n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports[0].facilityId).to.equal(1n);
      expect(reports[0].co2Tonnes).to.equal(380n);
      expect(reports[0].period).to.equal("2023");
    });

    it("appends multiple reports for same facility in order", async function () {
      await registry.connect(org1).reportEmissions(1n, 420n, "2022");
      await registry.connect(org1).reportEmissions(1n, 380n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports.length).to.equal(2);
      expect(reports[0].period).to.equal("2022");
      expect(reports[1].period).to.equal("2023");
    });

    it("emits EmissionReported with correct args", async function () {
      // 400 == targetEmissions → meetsTarget=true; 20% reduction from baseline=500
      await expect(
        registry.connect(org1).reportEmissions(1n, 400n, "2023")
      )
        .to.emit(registry, "EmissionReported")
        .withArgs(1n, 400n, "2023", true, 20n, true);
    });

    it("co2 == baseline: isReduction=true, percentChange=0", async function () {
      await registry.connect(org1).reportEmissions(1n, 500n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports[0].isReduction).to.equal(true);
      expect(reports[0].percentChange).to.equal(0n);
    });
  });

  // ─── edge cases ──────────────────────────────────────────────────────────

  describe("edge cases", function () {
    it("getReports returns empty array for facility with no reports", async function () {
      await registry.connect(org1).registerFacility(
        FACILITY_1.orgName, FACILITY_1.facilityName, FACILITY_1.industryType,
        FACILITY_1.latitude, FACILITY_1.longitude,
        FACILITY_1.baselineEmissions, FACILITY_1.reductionTarget
      );
      const reports = await registry.getReports(1n);
      expect(reports.length).to.equal(0);
    });

    it("getOrgFacilities returns empty array for unknown wallet", async function () {
      const ids = await registry.getOrgFacilities(stranger.address);
      expect(ids.length).to.equal(0);
    });

    it("reductionTarget=0: any amount <= baseline passes", async function () {
      await registry.connect(org1).registerFacility(
        "Org", "Facility", "Other", 0n, 0n, 1000n, 0n
      );
      await registry.connect(org1).reportEmissions(1n, 1000n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports[0].meetsTarget).to.equal(true);
    });

    it("reductionTarget=100: targetEmissions=0, any positive emission fails", async function () {
      await registry.connect(org1).registerFacility(
        "Org", "Facility", "Other", 0n, 0n, 1000n, 100n
      );
      await registry.connect(org1).reportEmissions(1n, 1n, "2023");
      const reports = await registry.getReports(1n);
      expect(reports[0].meetsTarget).to.equal(false);
    });

    it("negative coordinates stored and retrieved correctly", async function () {
      await registry.connect(org1).registerFacility(
        "Org", "Santiago Plant", "Other",
        -33448400n, -70672200n, 500n, 20n
      );
      const f = await registry.getFacility(1n);
      expect(f.latitude).to.equal(-33448400n);
      expect(f.longitude).to.equal(-70672200n);
    });
  });
});
