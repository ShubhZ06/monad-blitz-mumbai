const hre = require("hardhat");

async function main() {
    console.log("Deploying updated MonadMons contract...");

    const MonadMons = await hre.ethers.getContractFactory("MonadMons");
    const monadMons = await MonadMons.deploy();

    await monadMons.waitForDeployment();

    console.log(`Updated MonadMons deployed to: ${await monadMons.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
