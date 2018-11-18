pragma solidity ^0.4.24;

import "@convergent/arc/contracts/EthPolynomialCurvedToken.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Convergent_Billboard is Ownable, EthPolynomialCurvedToken {
    using SafeMath for uint256;

    uint256 public cashed;                      // Amount of tokens that have been "cashed out."
    uint256 public maxTokens = 500;             // Total amount of Billboard tokens to be sold.
    uint256 public requiredAmt = 1 * 10**18;    // One token required per banner change.

    event Advertisement(bytes32 what, uint256 indexed when);

    constructor()
        EthPolynomialCurvedToken(
            "Convergent Billboard Token",
            "CBT",
            18,
            1,
            1000
        )
        public
    {}
    
    /// Overwrite 
    function priceToMint(uint256 numTokens) public view returns(uint256) {
        require(totalSupply().add(numTokens) < maxToken.mul(uint256(decimals())), "Must not have reached cap.");
        return curveIntegral(totalSupply().add(numTokens)).sub(poolBalance);
    }

    /// Overwrite
    function rewardForBurn(uint256 numTokens) public view returns(uint256) {
        require(totalSupply() < maxToken.mul(uint256(decimals())), "Must not have reached cap.");
        return poolBalance.sub(curveIntegral(totalSupply().sub(numTokens)));
    }

    function purchaseAdvertisement(bytes32 _what) public payable {
        mint(requiredAmt);
        submit(_what);
    }

    function submit(bytes32 _what)
        public
    {
        require(balanceOf(msg.sender) >= requiredAmt);

        cashed++; // increment cashed counter
        _transfer(msg.sender, address(0x1337), requiredAmt);

        uint256 dec = 10**uint256(decimals());
        uint256 newCliff = curveIntegral(
            (cashed).mul(dec)
        );
        uint256 oldCliff = curveIntegral(
            (cashed - 1).mul(dec)
        );
        uint256 cliffDiff = newCliff.sub(oldCliff);
        owner().transfer(cliffDiff);

        emit Advertisement(_what, block.timestamp);
    }

    function withdraw() onlyOwner public {
        require(totalSupply() >= maxToken.mul(uint256(decimals())), "Must have reached cap.");
        owner().transfer(address(this).balance);
    }

    function () public { revert(); }
}
