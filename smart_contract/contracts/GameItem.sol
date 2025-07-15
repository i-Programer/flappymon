// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract GameItem is ERC1155, AccessControl, ERC1155Burnable {
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    IERC20 public immutable flapToken;
    address public treasury;

    mapping(uint256 => uint256) public itemPrices;

    constructor(
        address defaultAdmin,
        address minter,
        address _flapToken,
        address _treasury,
        string memory baseURI
    ) ERC1155(baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(URI_SETTER_ROLE, defaultAdmin);

        flapToken = IERC20(_flapToken);
        treasury = _treasury;

        itemPrices[0] = 80 * 1e18; // Initial price for item ID 0
    }

    function setURI(string memory newURI) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newURI);
    }

    function setItemPrice(uint256 id, uint256 price) external onlyRole(DEFAULT_ADMIN_ROLE) {
        itemPrices[id] = price;
    }

    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        treasury = newTreasury;
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data)
        external
        onlyRole(MINTER_ROLE)
    {
        _mint(to, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        external
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }

    function buyItem(uint256 id, uint256 amount) external {
        uint256 totalCost = itemPrices[id] * amount;
        require(totalCost > 0, "Item not for sale");

        require(
            flapToken.transferFrom(msg.sender, treasury, totalCost),
            "Payment failed"
        );

        _mint(msg.sender, id, amount, "");
    }

    function buyItemWithPermit(
        uint256 id,
        uint256 amount,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        uint256 totalCost = itemPrices[id] * amount;
        require(totalCost > 0, "Item not for sale");
        require(totalCost <= value, "Insufficient permit value");

        // Use EIP-2612 permit signature before transferFrom
        ERC20Permit(address(flapToken)).permit(
            msg.sender,
            address(this),
            value,
            deadline,
            v, r, s
        );

        require(
            flapToken.transferFrom(msg.sender, treasury, totalCost),
            "Payment failed"
        );

        _mint(msg.sender, id, amount, "");
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
