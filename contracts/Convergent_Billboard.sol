pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "@convergent/arc/contracts/EthPolynomialCurvedToken.sol";

contract Convergent_Billboard is Ownable, EthPolynomialCurvedToken {
    using SafeMath for uint256;

    uint256 cashed; // Amount of tokens that have been "cashed out."
    uint256 requiredAmt = 1 * 10**18; // One token per banner change.

    event Advertisement(bytes32 what, uint256 indexed when);

    constructor()
        EthPolynomialCurvedToken(
            "Convergent Billboard",
            "CNVRGNT_BILL",
            18,
            1,
            1000
        ) public
    {}
    
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
}
