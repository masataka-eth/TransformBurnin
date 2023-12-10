import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

const { createTree } = require("../utils/merkletree");

describe("TokenURIforAPP", function () {
  const fixture = async () => {
    const [owner, admin, ...users] = await ethers.getSigners()
    const getcontract = await ethers.getContractFactory("TokenURIforAPP")
    const myContract = await getcontract.deploy()
    await myContract.deployed()

    const tree = createTree(users.map(account =>
        { return { address: account.address, allowedAmount: 30} }))
    await myContract.connect(owner).setMerkleRoot( tree.getHexRoot())

    return { myContract, owner, admin, users, tree }
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
        const { myContract, owner, users } = await loadFixture(fixture);
        const newCost = ethers.utils.parseEther("2");
        await expect(myContract.connect(users[0]).setCost(newCost)).to.be.reverted;
        await myContract.connect(owner).setCost(newCost);
        const checkValue = await myContract.cost();
        expect(checkValue).to.equal(newCost);
      });
    
      it("setBurninNFT", async function () {
        const { myContract, owner, users } = await loadFixture(fixture);
        const dummyAddress = users[0].address;
        await expect(myContract.connect(users[1]).setBurninNFT(dummyAddress)).to.be.reverted;
        await myContract.connect(owner).setBurninNFT(dummyAddress);
        const burninNFT = await myContract.burninNFT();
        expect(burninNFT).to.equal(dummyAddress);
      });
    
      it("setMerkleRoot", async function () {
        const { myContract, owner, users } = await loadFixture(fixture);
        const newRoot = "0x" + "ab".repeat(32);
        await expect(myContract.connect(users[0]).setMerkleRoot(newRoot)).to.be.reverted;
        await myContract.connect(owner).setMerkleRoot(newRoot);
        const merkleRoot = await myContract.merkleRoot();
        expect(merkleRoot).to.equal(newRoot);
      });
    
      it("setBaseURI", async function () {
        const { myContract, owner, users } = await loadFixture(fixture);
        const newURI = "https://newURI.com/";
        await expect(myContract.connect(users[0]).setBaseURI(newURI)).to.be.reverted;
        await myContract.connect(owner).setBaseURI(newURI);
        const baseURI = await myContract.baseURI();
        expect(baseURI).to.equal(newURI);
      });
    
      it("setBaseURI_lock", async function () {
        const { myContract, owner, users } = await loadFixture(fixture);
        const newURI = "https://newURI_lock.com/";
        await expect(myContract.connect(users[0]).setBaseURI_lock(newURI)).to.be.reverted;
        await myContract.connect(owner).setBaseURI_lock(newURI);
        const baseURI_lock = await myContract.baseURI_lock();
        expect(baseURI_lock).to.equal(newURI);
      });
    
      it("setBaseExtension", async function () {
        const { myContract, owner, users } = await loadFixture(fixture);
        const newExtension = ".xml";
        await expect(myContract.connect(users[0]).setBaseExtension(newExtension)).to.be.reverted;
        await myContract.connect(owner).setBaseExtension(newExtension);
        const baseExtension = await myContract.baseExtension();
        expect(baseExtension).to.equal(newExtension);
      });

      it("setBeforeRevealURI", async function () {
        const { myContract, owner, users } = await loadFixture(fixture);
        const newURI = "https://newBeforeRevealURI.com/";
        await expect(myContract.connect(users[0]).setBeforeRevealURI(newURI)).to.be.reverted;
        await myContract.connect(owner).setBeforeRevealURI(newURI);
        const beforeRevealURI = await myContract.beforeRevealURI();
        expect(beforeRevealURI).to.equal(newURI);
      });
    
      it("IncBurninIndex", async function () {
        const { myContract, owner, users } = await loadFixture(fixture);
        const initialIndex = await myContract.currentBurninIndex();
        await expect(myContract.connect(users[0]).IncBurninIndex()).to.be.reverted;
        await myContract.connect(owner).IncBurninIndex();
        const afterIndex = await myContract.currentBurninIndex();
        expect(afterIndex).to.equal(initialIndex.add(1));
      });
    
      it("setPaused", async function () {
        const { myContract, owner, users } = await loadFixture(fixture);
        const initialStatus = await myContract.paused();
        await expect(myContract.connect(users[0]).setPaused(!initialStatus)).to.be.reverted;
        await myContract.connect(owner).setPaused(!initialStatus);
        const afterStatus = await myContract.paused();
        expect(afterStatus).to.equal(!initialStatus);
      });
    
    // burninRegistoryで実施するので、ここではテストしない
    //   it("withdraw", async function () {
    //     const { myContract, owner, users } = await loadFixture(fixture);
    //     const amount = ethers.utils.parseEther("1");
    //     await owner.sendTransaction({ to: myContract.address, value: amount });
    //     const initialBalance = await ethers.provider.getBalance(owner.address);
    //     await expect(myContract.connect(users[0]).withdraw()).to.be.reverted;
    //     await myContract.connect(owner).withdraw();
    //     const finalBalance = await ethers.provider.getBalance(owner.address);
    //     expect(finalBalance).to.be.gt(initialBalance);
    //   });
    });

    describe("burninRegistory", function () {
        it("ok", async function () {
            const { myContract, owner, users,tree } = await loadFixture(fixture);
        
            let proof = tree.getHexProof(ethers.utils.solidityKeccak256(
                ['address', 'uint256'], [users[0].address,30]))

            // Deploy the ERC721Mock contract
            const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
            const erc721 = await ERC721Mock.deploy("Test Token", "TST");
        
            // Mint a token to user[0]
            for(let i = 1; i <= 5; i++){
                await erc721.connect(owner).mint(users[0].address, i);
            }
        
            // Set burninNFT to our ERC721Mock contract
            await myContract.connect(owner).setBurninNFT(erc721.address);
        
            // Set up other preconditions...
            await myContract.connect(owner).setPaused(false);

            expect(await myContract.getRemain(users[0].address,30,proof)).to.be.equal(30);
            
            // Call burninRegistory
            await expect(myContract.connect(users[0])
            .burninRegistory([1,2,4,5],30,proof,{ value: ethers.utils.parseEther("1") })).to.be.not.reverted;

            expect(await myContract.getRemain(users[0].address,30,proof)).to.be.equal(26);

            // check isBurnin array
            expect(await myContract.isBurnin([1,2,3,4,5])).to.be.deep.equal([true,true,false,true,true]);

            // Check withdraw
            // const initialBalance = await ethers.provider.getBalance(owner.address);
            // await expect(myContract.connect(users[0]).withdraw()).to.be.reverted;
            // await myContract.connect(owner).withdraw();
            // const finalBalance = await ethers.provider.getBalance(owner.address);
            // expect(finalBalance).to.be.gt(initialBalance);
        });

        it("sale is not active", async function () {
            const { myContract, owner, users,tree } = await loadFixture(fixture);
        
            let proof = tree.getHexProof(ethers.utils.solidityKeccak256(
                ['address', 'uint256'], [users[0].address,30]))

            // Deploy the ERC721Mock contract
            const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
            const erc721 = await ERC721Mock.deploy("Test Token", "TST");

            // Mint a token to user[0]
            for(let i = 1; i <= 5; i++){
                await erc721.connect(owner).mint(users[0].address, i);
            }
        
            // Set burninNFT to our ERC721Mock contract
            await myContract.connect(owner).setBurninNFT(erc721.address);
        
            // Set up other preconditions...
            // await myContract.connect(owner).setPaused(false);
            
            // Call burninRegistory
            await expect(myContract.connect(users[0])
            .burninRegistory([1,2,3,4,5],30,proof,{ value: ethers.utils.parseEther("1") }))
            .revertedWith("sale is not active")
        });
      
        it("You don't have a Allowlist!", async function () {
            const { myContract, owner, users,tree } = await loadFixture(fixture);
        
            let proof = tree.getHexProof(ethers.utils.solidityKeccak256(
                ['address', 'uint256'], [users[0].address,30]))

            // Deploy the ERC721Mock contract
            const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
            const erc721 = await ERC721Mock.deploy("Test Token", "TST");
        
            // Mint a token to user[0]
            for(let i = 1; i <= 5; i++){
                await erc721.connect(owner).mint(users[0].address, i);
            }

            // Set burninNFT to our ERC721Mock contract
            await myContract.connect(owner).setBurninNFT(erc721.address);
        
            // Set up other preconditions...
            await myContract.connect(owner).setPaused(false);
            
            // Call burninRegistory
            await expect(myContract.connect(users[0])
            .burninRegistory([1,2,3,4,5],29,proof,{ value: ethers.utils.parseEther("1") }))
            .revertedWith("You don't have a Allowlist!")
        });

        it("need to burnin at least 1 NFT", async function () {
            const { myContract, owner, users,tree } = await loadFixture(fixture);
        
            let proof = tree.getHexProof(ethers.utils.solidityKeccak256(
                ['address', 'uint256'], [users[0].address,30]))

            // Deploy the ERC721Mock contract
            const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
            const erc721 = await ERC721Mock.deploy("Test Token", "TST");
        
            // Mint a token to user[0]
            for(let i = 1; i <= 5; i++){
                await erc721.connect(owner).mint(users[0].address, i);
            }

            // Set burninNFT to our ERC721Mock contract
            await myContract.connect(owner).setBurninNFT(erc721.address);
        
            // Set up other preconditions...
            await myContract.connect(owner).setPaused(false);
            
            // Call burninRegistory
            await expect(myContract.connect(users[0])
            .burninRegistory([],30,proof,{ value: ethers.utils.parseEther("1") }))
            .revertedWith("need to burnin at least 1 NFT")
        });

        it("claim is over max amount", async function () {
            const { myContract, owner, users,tree } = await loadFixture(fixture);
        
            let proof = tree.getHexProof(ethers.utils.solidityKeccak256(
                ['address', 'uint256'], [users[0].address,30]))

            // Deploy the ERC721Mock contract
            const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
            const erc721 = await ERC721Mock.deploy("Test Token", "TST");
        
            // Mint a token to user[0]
            for(let i = 1; i <= 31; i++){
                await erc721.connect(owner).mint(users[0].address, i);
            }

            // Set burninNFT to our ERC721Mock contract
            await myContract.connect(owner).setBurninNFT(erc721.address);
        
            // Set up other preconditions...
            await myContract.connect(owner).setPaused(false);
            
            // Call burninRegistory
            await expect(myContract.connect(users[0])
            .burninRegistory(Array.from({length: 30}, (_, i) => i + 1),30,proof,{ value: ethers.utils.parseEther("1") }))
            .to.be.not.reverted;

            await expect(myContract.connect(users[0])
            .burninRegistory([31],30,proof,{ value: ethers.utils.parseEther("1") }))
            it("ok", async function () {
                const { myContract, owner, users,tree } = await loadFixture(fixture);
            
                let proof = tree.getHexProof(ethers.utils.solidityKeccak256(
                    ['address', 'uint256'], [users[0].address,30]))
    
                // Deploy the ERC721Mock contract
                const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
                const erc721 = await ERC721Mock.deploy("Test Token", "TST");
            
                // Mint a token to user[0]
                for(let i = 1; i <= 5; i++){
                    await erc721.connect(owner).mint(users[0].address, i);
                }
            
                // Set burninNFT to our ERC721Mock contract
                await myContract.connect(owner).setBurninNFT(erc721.address);
            
                // Set up other preconditions...
                await myContract.connect(owner).setPaused(false);
                
                // Call burninRegistory
                await expect(myContract.connect(users[0])
                .burninRegistory([1,2,3,4,5],30,proof,{ value: ethers.utils.parseEther("1") })).to.be.not.reverted;
            });
        });

        it("not enough eth", async function () {
            const { myContract, owner, users,tree } = await loadFixture(fixture);
        
            let proof = tree.getHexProof(ethers.utils.solidityKeccak256(
                ['address', 'uint256'], [users[0].address,30]))

            // Deploy the ERC721Mock contract
            const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
            const erc721 = await ERC721Mock.deploy("Test Token", "TST");
        
            // Mint a token to user[0]
            for(let i = 1; i <= 5; i++){
                await erc721.connect(owner).mint(users[0].address, i);
            }
        
            // Set burninNFT to our ERC721Mock contract
            await myContract.connect(owner).setBurninNFT(erc721.address);
        
            // Set up other preconditions...
            await myContract.connect(owner).setPaused(false);
            
            // Call burninRegistory
            await expect(myContract.connect(users[0])
            .burninRegistory([1,2,3,4,5],30,proof,{ value: ethers.utils.parseEther("0.004") }))
            .revertedWith("not enough eth")
        });

        it("OnlyOperatedByTokenOwner", async function () {
            const { myContract, owner, users,tree } = await loadFixture(fixture);
        
            let proof = tree.getHexProof(ethers.utils.solidityKeccak256(
                ['address', 'uint256'], [users[0].address,30]))

            // Deploy the ERC721Mock contract
            const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
            const erc721 = await ERC721Mock.deploy("Test Token", "TST");
        
            // Mint a token to user[0]
            for(let i = 1; i <= 5; i++){
                await erc721.connect(owner).mint(users[0].address, i);
            }
        
            // Set burninNFT to our ERC721Mock contract
            await myContract.connect(owner).setBurninNFT(erc721.address);
        
            // Set up other preconditions...
            await myContract.connect(owner).setPaused(false);
            
            // Call burninRegistory
            await expect(myContract.connect(users[0])
            .burninRegistory([6],30,proof,{ value: ethers.utils.parseEther("1") })).to.be.reverted;

        });

    });

    describe("burninRegistory", function () {
        it("integration", async function () {
            const { myContract, owner, users,tree } = await loadFixture(fixture);
        
            let proof = tree.getHexProof(ethers.utils.solidityKeccak256(
                ['address', 'uint256'], [users[0].address,30]))

            // Deploy the ERC721Mock contract
            const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
            const erc721 = await ERC721Mock.deploy("Test Token", "TST");
        
            // Mint a token to user[0]
            for(let i = 1; i <= 5; i++){
                await erc721.connect(owner).mint(users[0].address, i);
            }
        
            // Set burninNFT to our ERC721Mock contract
            await myContract.connect(owner).setBurninNFT(erc721.address);
        
            // Set up other preconditions...
            await myContract.connect(owner).setPaused(false);
            
            // Call burninRegistory
            await expect(myContract.connect(users[0])
            .burninRegistory([1,3,5],30,proof,{ value: ethers.utils.parseEther("1") })).to.be.not.reverted;

            // check tokenURI
            expect(await myContract.tokenURI_future(2,0)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/metadata/2.json");
            expect(await myContract.tokenURI_future(2,1)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app_lock/metadata/2.json");

            expect(await myContract.tokenURI_future(4,0)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/metadata/4.json");
            expect(await myContract.tokenURI_future(4,1)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app_lock/metadata/4.json");

            expect(await myContract.tokenURI_future(1,0)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/reveal/metadata/0.json");
            expect(await myContract.tokenURI_future(1,1)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/reveal/metadata/1.json");

            expect(await myContract.tokenURI_future(3,0)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/reveal/metadata/0.json");
            expect(await myContract.tokenURI_future(3,1)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/reveal/metadata/1.json");
            
            expect(await myContract.tokenURI_future(5,0)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/reveal/metadata/0.json");
            expect(await myContract.tokenURI_future(5,1)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/reveal/metadata/1.json");

            // reveal
            await myContract.connect(owner).setPaused(true);
            await myContract.connect(owner).IncBurninIndex();
            expect(await myContract.tokenURI_future(1,0)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/metadata/1/1.json");
            expect(await myContract.tokenURI_future(1,1)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app_lock/metadata/1/1.json");

            expect(await myContract.tokenURI_future(3,0)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/metadata/1/3.json");
            expect(await myContract.tokenURI_future(3,1)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app_lock/metadata/1/3.json");
            
            expect(await myContract.tokenURI_future(5,0)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app/metadata/1/5.json");
            expect(await myContract.tokenURI_future(5,1)).to.be.equal("https://nft.aopanda.ainy-llc.com/site/app_lock/metadata/1/5.json");



        });
    });



});
