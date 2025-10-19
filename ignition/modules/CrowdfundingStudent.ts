import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrowdfundingStudentModule = buildModule("CrowdfundingStudentModule", (m) => {
  const kyc = m.contract("KYCRegistry_MuhammadShayanAhmed");
  const crowdfunding = m.contract("Crowdfunding_MuhammadShayanAhmed", [kyc]);

  return { kyc, crowdfunding };
});

export default CrowdfundingStudentModule;


