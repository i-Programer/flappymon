// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Flappymon} from "./Flappymon.sol";

contract GachaMachine is Ownable {
    Flappymon public flappymon;

    event GachaRolled(address indexed user, uint256 indexed tokenId, uint8 rarity);

    constructor(address _flappymon, address initialOwner) Ownable(initialOwner) {
        flappymon = Flappymon(_flappymon);
    }

    function rollGacha() external {
        // Pseudo-random logic (improve this later)
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, blockhash(block.number - 1)))) % 100;
        uint8 rarity;

        if (rand < 50) rarity = 0;         // 50% Common
        else if (rand < 80) rarity = 1;    // 30% Rare
        else if (rand < 95) rarity = 2;    // 15% Epic
        else rarity = 3;                   // 5% Legendary

        // Mint and get token ID
        uint256 tokenId = flappymon.safeMint(msg.sender, rarity);

        emit GachaRolled(msg.sender, tokenId, rarity);
    }
}
