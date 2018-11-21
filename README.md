# [The Convergent Billboard](https://billboard.convergent.cx)

The Convergent Billboard is a bonding curve linked to an advertisement.

> protip: For a primer on bonding curves see [here]().

## Tell me more...

The [Convergent Billboard](./contracts/Convergent_Billboard.sol) is a smart contract
that allows the buying and selling of the Convergent Billboard Token (CBT) on a determined
price path that will always guarentee liqudity.

One CBT can be used to change the image that is displayed under the area of the curve
which is unlocked by the number of tokens bought. When you spend CBT to change the 
billboard, you upload your image to IPFS and submit the hash to the contract. There 
is no time lock for your image and someone can change it to something different at
any time.

You are not required to spend your CBT right away. Instead you can open the speculation
market and buy the tokens and simply hold them. If the billboard becomes more popular,
and more tokens are minted into existence, you will be able to sell your tokens later
at a higher price.

If you simply want to change the billboard without having to worry about the tokens,
simply click "Buy with Eth" button on the front-end and confirm with Metamask.

## Technical Details

The Convergent Billboard is made entirely on the decentralized tech stack, including IPFS and
Ethereum. 

### Testing

### Running locally

```
$ yarn start
```

Open Metamask on the mainnet.
