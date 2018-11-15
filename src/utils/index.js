import { utils as w3utils } from 'web3';

export const addDecimals = (tokens) => {
  return w3utils.toWei(String(tokens), 'ether').toString();
}

export const getPrice = (inverseSlope, supply, exp) => {
  return w3utils.toBN(1 / inverseSlope * (supply ** exp));
}

export const removeDecimals = (tokens) => {
  return w3utils.fromWei(tokens, 'ether').toString();
}
