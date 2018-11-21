pragma solidity ^0.4.24;

import "@convergent/arc/contracts/EthPolynomialCurvedToken.sol";

contract Convergent_Billboard is EthPolynomialCurvedToken {
    using SafeMath for uint256;

    uint256 public cashed;                      // Amount of tokens that have been "cashed out."
    uint256 public maxTokens;                   // Total amount of Billboard tokens to be sold.
    uint256 public requiredAmt;                 // Required amount of token per banner change.
    address public safe;                        // Target to send the funds.

    event Advertisement(bytes32 what, uint256 indexed when);

    constructor(uint256 _maxTokens, uint256 _requiredAmt, address _safe)
        EthPolynomialCurvedToken(
            "Convergent Billboard Token",
            "CBT",
            18,
            1,
            1000
        )
        public
    {
        maxTokens = _maxTokens * 10**18;
        requiredAmt = _requiredAmt * 10**18;
        safe = _safe;
    }

    /// Overwrite
    function mint(uint256 numTokens) public payable {
        uint256 newTotal = totalSupply().add(numTokens);
        if (newTotal > maxTokens) {
            super.mint(maxTokens.sub(totalSupply()));
            // The super.mint() function will not allow 0
            // as an argument rendering this as sufficient
            // to enforce a cap of maxTokens.
        } else {
            super.mint(numTokens);
        }
    }

    function purchaseAdvertisement(bytes32 _what)
        public
        payable
    {
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
        safe.transfer(cliffDiff);

        emit Advertisement(_what, block.timestamp);
    }

    function () public { revert(); }
}
