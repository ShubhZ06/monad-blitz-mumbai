// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BattleEscrow is Ownable {
    IERC721 public monContract;
    
    struct Battle {
        address player1;
        uint256 token1;
        address player2;
        uint256 token2;
        bool isActive;
    }

    mapping(bytes32 => Battle) public battles;

    event NFTStaked(bytes32 indexed battleRoomId, address indexed player, uint256 tokenId);
    event BattleResolved(bytes32 indexed battleRoomId, address indexed winner, uint256 wonToken1, uint256 wonToken2);

    constructor(address _monContract) Ownable(msg.sender) {
        monContract = IERC721(_monContract);
    }

    // Transfers NFT from user to escrow
    function stakeNFT(bytes32 roomID, uint256 tokenId) external {
        require(monContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        
        // Transfer to Escrow
        monContract.transferFrom(msg.sender, address(this), tokenId);

        Battle storage battle = battles[roomID];
        if (battle.player1 == address(0)) {
            battle.player1 = msg.sender;
            battle.token1 = tokenId;
        } else {
            require(battle.player2 == address(0), "Battle full");
            require(battle.player1 != msg.sender, "Already staked");
            battle.player2 = msg.sender;
            battle.token2 = tokenId;
            battle.isActive = true;
        }

        emit NFTStaked(roomID, msg.sender, tokenId);
    }

    // Resolves battle, triggered by authorized arbiter (owner for simplicity) or signatures
    function resolveBattle(bytes32 roomID, address winner) external onlyOwner {
        Battle storage battle = battles[roomID];
        require(battle.isActive, "Battle not active");
        require(winner == battle.player1 || winner == battle.player2, "Winner not in battle");

        battle.isActive = false;
        
        // Transfer both NFTs to the winner
        monContract.transferFrom(address(this), winner, battle.token1);
        monContract.transferFrom(address(this), winner, battle.token2);

        emit BattleResolved(roomID, winner, battle.token1, battle.token2);
    }
    
    // Emergency withdraw logic here if needed
    function cancelBattle(bytes32 roomID) external onlyOwner {
        Battle storage battle = battles[roomID];
        require(battle.isActive || battle.player1 != address(0), "No active battle to cancel");
        
        battle.isActive = false;
        if(battle.player1 != address(0)) {
            monContract.transferFrom(address(this), battle.player1, battle.token1);
        }
        if(battle.player2 != address(0)) {
            monContract.transferFrom(address(this), battle.player2, battle.token2);
        }
    }
}
