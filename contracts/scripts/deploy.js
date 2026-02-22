const hre = require("hardhat");

async function main() {
    console.log("Deploying MonadMons...");
    const MonadMons = await hre.ethers.getContractFactory("MonadMons");
    const monadMons = await MonadMons.deploy();
    await monadMons.waitForDeployment();
    const monadMonsAddress = await monadMons.getAddress();
    console.log("MonadMons deployed to:", monadMonsAddress);

    console.log("Deploying BattleEscrow...");
    const BattleEscrow = await hre.ethers.getContractFactory("BattleEscrow");
    const battleEscrow = await BattleEscrow.deploy(monadMonsAddress);
    await battleEscrow.waitForDeployment();
    console.log("BattleEscrow deployed to:", await battleEscrow.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
