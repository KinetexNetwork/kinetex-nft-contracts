// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library Levels {
    enum Level {
        DUST,
        GEM,
        CRYSTAL,
        LIGHTNING
    }

    function getLevelByDustAmount(uint256 dust) internal pure returns (Level) {
        if (dust < 10) {
            return Level.DUST;
        }

        if (dust < 100) {
            return Level.GEM;
        }

        if (dust < 1000) {
            return Level.CRYSTAL;
        }

        return Level.LIGHTNING;
    }
}
