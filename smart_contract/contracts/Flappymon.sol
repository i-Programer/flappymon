// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Flappymon is ERC721, Ownable {
    uint256 public nextTokenId = 0;
    string public baseTokenURI;

    // Compact rarity mapping using uint8 saves gas
    mapping(uint256 => uint8) public tokenRarity;

    constructor(address initialOwner, string memory _baseTokenURI)
        ERC721("Flappymon", "FLAM")
        Ownable(initialOwner)
    {
        baseTokenURI = _baseTokenURI;
    }

    function setBaseURI(string calldata _uri) external onlyOwner {
        baseTokenURI = _uri;
    }

    function safeMint(address to, uint8 rarity) external onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _mint(to, tokenId);
        tokenRarity[tokenId] = rarity;
        return tokenId;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    // Readable enums for frontend reference
    function getSkillSlots(uint8 rarity) public pure returns (uint8) {
        if (rarity == 0) return 1; // Common
        if (rarity == 1) return 2; // Rare
        if (rarity == 2) return 3; // Epic
        if (rarity == 3) return 4; // Legendary
        revert("Invalid rarity");
    }

    function getItemSlots(uint8 rarity) public pure returns (uint8) {
        if (rarity == 2) return 1; // Epic
        if (rarity == 3) return 2; // Legendary
        return 0;
    }
}
