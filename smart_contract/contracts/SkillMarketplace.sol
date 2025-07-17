// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SkillMarketplace is ReentrancyGuard {
    IERC721 public immutable skillNFT;
    IERC20 public immutable flapToken;

    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(uint256 => Listing) public listings;

    event SkillListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event Cancelled(address indexed seller, uint256 indexed tokenId);
    event Purchased(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 price);

    constructor(address _skillNFT, address _flapToken) {
        skillNFT = IERC721(_skillNFT);
        flapToken = IERC20(_flapToken);
    }

    // ========== Admin Functions ==========

    function listSkill(address seller, uint256 tokenId, uint256 price) external {
        require(
            skillNFT.ownerOf(tokenId) == seller ||
            skillNFT.isApprovedForAll(skillNFT.ownerOf(tokenId), msg.sender) ||
            skillNFT.getApproved(tokenId) == msg.sender,
            "Not your NFT"
        );

        listings[tokenId] = Listing({ seller: seller, price: price });
        emit SkillListed(seller, tokenId, price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not your listing");

        delete listings[tokenId];
        emit Cancelled(msg.sender, tokenId);
    }

    // ========== Buyer Functions ==========

    function buySkill(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Not listed");

        require(
            flapToken.transferFrom(msg.sender, listing.seller, listing.price),
            "FLAP transfer failed"
        );

        skillNFT.safeTransferFrom(listing.seller, msg.sender, tokenId);
        delete listings[tokenId];

        emit Purchased(msg.sender, listing.seller, tokenId, listing.price);
    }

    function buySkillWithPermit(
        uint256 tokenId,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Not listed");
        require(value >= listing.price, "Insufficient permit value");

        // ✅ Approve token transfer using permit signature
        ERC20Permit(address(flapToken)).permit(
            msg.sender,
            address(this),
            value,
            deadline,
            v, r, s
        );

        require(
            flapToken.transferFrom(msg.sender, listing.seller, listing.price),
            "FLAP transfer failed"
        );

        skillNFT.safeTransferFrom(listing.seller, msg.sender, tokenId);
        delete listings[tokenId];

        emit Purchased(msg.sender, listing.seller, tokenId, listing.price);
    }

    // ========== View ==========

    function getListing(uint256 tokenId) external view returns (address seller, uint256 price) {
        Listing memory l = listings[tokenId];
        return (l.seller, l.price);
    }
}
