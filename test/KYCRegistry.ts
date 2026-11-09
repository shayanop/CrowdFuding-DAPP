import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("KYCRegistry admins", async function () {
  const { viem } = await network.connect();
  const [owner, second, user] = await viem.getWalletClients();

  it("owner can add an admin who can then approve KYC; non-owners cannot manage admins", async function () {
    const kyc = await viem.deployContract("KYCRegistry_MuhammadShayanAhmed");
    const asSecond = { client: { wallet: second } };
    const asUser = { client: { wallet: user } };

    await assert.rejects(kyc.write.setAdmin([user.account.address, true], { account: second.account }), /Only owner/);

    await kyc.write.setAdmin([second.account.address, true]);
    assert.equal(await kyc.read.isAdmin([second.account.address]), true);
    assert.equal(await kyc.read.isVerified([second.account.address]), true);

    const kycAsSecond = await viem.getContractAt("KYCRegistry_MuhammadShayanAhmed", kyc.address, asSecond);
    const kycAsUser = await viem.getContractAt("KYCRegistry_MuhammadShayanAhmed", kyc.address, asUser);
    await kycAsUser.write.submitKyc(["Jane", "12345"]);
    await kycAsSecond.write.approve([user.account.address]);
    assert.equal(await kyc.read.isVerified([user.account.address]), true);

    await kyc.write.setAdmin([second.account.address, false]);
    await assert.rejects(kycAsSecond.write.reject([user.account.address, "x"]), /Only admin/);
    await assert.rejects(kyc.write.setAdmin([owner.account.address, false]), /Owner is always admin/);
  });
});
