// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TimeToken (TTK)
/// @notice 1 TTK = 1 hour of service. Minting is controlled by the owner (platform or deployer).
contract TimeToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("TimeToken", "TTK") Ownable(initialOwner) {
        // Optionally mint initial supply to owner for bootstrapping liquidity/rewards
        // _mint(initialOwner, 0);
    }

    /// @notice Mint new TTK to a recipient. Only owner can mint.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}


