import bs58 from 'bs58';
import { utils as w3utils } from 'web3';

const { toBN } = w3utils;

export const addDecimals = (tokens) => {
  return w3utils.toWei(String(tokens), 'ether').toString();
}

export const getPrice = (inverseSlope, supply, exp) => {
  return w3utils.toBN(1 / inverseSlope * (supply ** exp));
}

export const removeDecimals = (tokens) => {
  return w3utils.fromWei(String(tokens), 'ether').toString();
}

export const getBytes32FromMultihash = (mhash) => {
  const decoded = bs58.decode(mhash);

  return {
    digest: `0x${decoded.slice(2).toString('hex')}`,
    hashFunction: decoded[0],
    size: decoded[1],
  };
}

export const getMultihashFromBytes32 = (mhashObj) => {
  const { digest, hashFunction, size } = mhashObj;
  if (size === 0) return null;

  const hashBytes = Buffer.from(digest.slice(2), 'hex');

  const multihashBytes = new (hashBytes.constructor)(2 + hashBytes.length);
  multihashBytes[0] = hashFunction;
  multihashBytes[1] = size;
  multihashBytes.set(hashBytes, 2);
  return bs58.encode(multihashBytes);
}

// export const curveIntegral = (t, exp, inverseSlope, dec) => {
//   const nexp = exp.add(1);
//   return  (t.pow(nexp)).div(nexp).div(inverseSlope).div(dec);
// }

// export const priceToMint = (numTokens, totalSupply, poolBalance) => {
//   numTokens = toBN(numTokens);
//   totalSupply = toBN(totalSupply);
//   poolBalance = toBN(poolBalance);
//   return curveIntegral(totalSupply.add(numTokens), toBN(1), toBN(1000), toBN(10**18)).sub(poolBalance)
// }
