import { utils as w3utils } from 'web3';

export const addDecimals = (tokens) => {
  return w3utils.toWei(String(tokens), 'ether').toString();
}

export const removeDecimals = (tokens) => {
  return w3utils.fromWei(tokens, 'ether').toString();
}
