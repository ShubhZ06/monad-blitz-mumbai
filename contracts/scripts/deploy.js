const hre = require("hardhat");

async function main() {
    console.log("Deploying PokeBattle...");
    const PokeBattle = await hre.ethers.getContractFactory("PokeBattle");
    const pokeBattle = await PokeBattle.deploy();
    await pokeBattle.waitForDeployment();
    const pokeBattleAddress = await pokeBattle.getAddress();
    console.log("PokeBattle deployed to:", pokeBattleAddress);

    console.log("Deploying BattleEscrow...");
    const BattleEscrow = await hre.ethers.getContractFactory("BattleEscrow");
    const battleEscrow = await BattleEscrow.deploy(pokeBattleAddress);
    await battleEscrow.waitForDeployment();
    console.log("BattleEscrow deployed to:", await battleEscrow.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
