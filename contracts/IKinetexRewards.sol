// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IKinetexRewards {
    function initialize() external;

    function safeMint(address to, uint256 dust) external;

    function burn(uint256 tokenId) external;

    function burnPriveleged(uint256 tokenId) external;

    function setBaseURI(string calldata uri) external;

    function getDust(uint256 tokenId) external view returns (uint256);

    function getNextTokenId() external view returns (uint256);
}
