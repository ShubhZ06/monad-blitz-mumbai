// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MonadMons is ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;

    enum Tier { Starter, Standard, Premium }

    struct MonStats {
        uint8 attack;
        uint8 defense;
        uint8 speed;
        Tier tier;
    }

    mapping(uint256 => MonStats) public monStats;
    mapping(address => uint256) public lastFreeMintTime;
    
    uint256 public constant DAILY_COOLDOWN = 1 days;
    uint256 public constant PREMIUM_PRICE = 0.1 ether; // 0.1 MON

    event MonMinted(address indexed owner, uint256 indexed tokenId, Tier tier);

    constructor() ERC721("MonadMons", "MONS") Ownable(msg.sender) {}

    // Helper to generate some pseudo-random stats
    function _generateStats(Tier _tier, uint256 _tokenId) internal view returns (MonStats memory) {
        uint256 randomWord = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _tokenId)));
        
        uint8 baseAttack = 10;
        uint8 baseDefense = 10;
        uint8 baseSpeed = 10;
        
        if (_tier == Tier.Standard) {
            baseAttack = 20;
            baseDefense = 20;
            baseSpeed = 20;
        } else if (_tier == Tier.Premium) {
            baseAttack = 40;
            baseDefense = 40;
            baseSpeed = 40;
        }

        uint8 attack = baseAttack + uint8(randomWord % 20);
        uint8 defense = baseDefense + uint8((randomWord >> 8) % 20);
        uint8 speed = baseSpeed + uint8((randomWord >> 16) % 20);

        return MonStats(attack, defense, speed, _tier);
    }

    function _mintCard(address to, Tier _tier) internal returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        MonStats memory stats = _generateStats(_tier, tokenId);
        monStats[tokenId] = stats;
        
        emit MonMinted(to, tokenId, _tier);
        return tokenId;
    }

    // Task 2.1: mintStarter - Restricted to users with 0 balance
    function mintStarter() external {
        require(balanceOf(msg.sender) == 0, "Already own a Mon");
        _mintCard(msg.sender, Tier.Starter);
    }

    // Task 2.1: claimDaily - Enforce 24-hour cooldown, standard tier
    function claimDaily() external {
        require(block.timestamp >= lastFreeMintTime[msg.sender] + DAILY_COOLDOWN, "Cooldown active");
        lastFreeMintTime[msg.sender] = block.timestamp;
        _mintCard(msg.sender, Tier.Standard);
    }

    // Task 2.1: buyCard - Payable function (e.g., 0.1 MON), premium tier
    function buyCard() external payable {
        require(msg.value >= PREMIUM_PRICE, "Insufficient MON sent");
        _mintCard(msg.sender, Tier.Premium);
    }
    
    function withdrawMoney() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}
