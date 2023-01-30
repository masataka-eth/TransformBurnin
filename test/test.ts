import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TokenURI", function () {
  const fixture = async () => {
    const [owner, admin, ...users] = await ethers.getSigners()
    const getcontract = await ethers.getContractFactory("TokenURI")
    const myContract = await getcontract.deploy()
    await myContract.deployed()

    return { myContract, owner, admin, users }
  }

  describe("account test info display", function () {
    it("account test", async function () {
      const { owner, admin, users } = await loadFixture(fixture);

      // test info---
      console.log("owner address : %s", owner.address);
      console.log("admin address : %s", admin.address);
      console.log("users[0] address : %s", users[0].address);
      console.log("users[1] address : %s", users[1].address);
      console.log("users[2] address : %s", users[2].address);
      console.log("owner value : %s", await owner.getBalance());
      console.log("users[0] value : %s", await users[0].getBalance());
    });
  });

  describe("Only Admin", function () {
    it("setCost", async function () {
      const { myContract,owner, admin, users } = await loadFixture(fixture);

      const newcost = ethers.utils.parseEther("2");
      await expect(
        myContract.connect(users[0]).setCost(newcost)
        ).to.be.reverted;
      await myContract.connect(owner).setCost(newcost);
      const checkvalue = await myContract.cost();
      expect(checkvalue).to.equal(newcost);
    });
  });



});
