// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract SkillNFT is ERC721, Ownable,ERC721Burnable {
    using Strings for uint256;

    uint256 public nextTokenId;
    string public baseTokenURI;

    mapping(uint256 => uint8) public skillType;   // e.g., 0=Dash, 1=Dissapear...
    mapping(uint256 => uint8) public skillLevel;  // 1–10 maybe

    constructor(address initialOwner, string memory _baseTokenURI)
        ERC721("FlappymonSkill", "SKILL")
        Ownable(initialOwner)
    {
        baseTokenURI = _baseTokenURI;
    }

    function safeMint(address to, uint8 _type, uint8 _level) external onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId;
        nextTokenId++;
        _mint(to, tokenId);
        skillType[tokenId] = _type;
        skillLevel[tokenId] = _level;
        return tokenId;
    }



    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Not minted");
        return string(
            abi.encodePacked(
                baseTokenURI,
                Strings.toString(uint256(skillType[tokenId])),
                "_lvl",
                Strings.toString(uint256(skillLevel[tokenId])),
                ".json"
            )
        );
    }

    function getSkillData(uint256 tokenId) external view returns (uint8, uint8) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return (skillType[tokenId], skillLevel[tokenId]);
    }
}
