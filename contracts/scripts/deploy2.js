const hre = require("hardhat");

async function main() {
    console.log("Deploying updated PokeBattle contract...");

    const PokeBattle = await hre.ethers.getContractFactory("PokeBattle");
    const pokeBattle = await PokeBattle.deploy();

    await pokeBattle.waitForDeployment();

    console.log(`Updated PokeBattle deployed to: ${await pokeBattle.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
