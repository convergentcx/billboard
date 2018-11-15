import React, { Component } from 'react';
import {
  Button,
  Tooltip,
 } from '@material-ui/core';

import Chart from './components/Chart/Chart';

import './App.css';

import withContext from './hoc/withContext';

const mockCurveData = {
  currentPrice: 10,
  exponent: 1,
  inverseSlope: 1000,
  poolBalance: 230,
  totalSupply: 10000,
};

class App extends Component {
  constructor(props, context) {
    super(props);
    this.handleBuy = this.handleBuy.bind(this);
    this.handleSell = this.handleSell.bind(this);
    this.state = {
      addr: 'hello_world',
      billboard: {},
      billboardAddress: 'unavailable',
      keys: mockCurveData,
      currentPrice: 0,
    }
  }

  async componentDidMount() {
    const { contracts, web3 } = this.props.drizzle;
    const { Convergent_Billboard: billboard } = contracts;
    const me = (await web3.eth.getAccounts())[0];

    const exponentKey = billboard.methods.exponent.cacheCall();
    const inverseSlopeKey = billboard.methods.inverseSlope.cacheCall();
    const poolBalanceKey = billboard.methods.poolBalance.cacheCall();
    const totalSupplyKey = billboard.methods.totalSupply.cacheCall();

    const curveData = {
      exponent: await billboard.methods.exponent().call(),
      inverseSlope: await billboard.methods.inverseSlope().call(),
      poolBalance: await billboard.methods.poolBalance().call(),
      totalSupply: await billboard.methods.totalSupply().call(),
    }
    const currentPrice = (1 / curveData.inverseSlope) * (curveData.totalSupply) ** curveData.exponent;

    // Object.assign(curveData, { currentPrice });

    this.setState({
      addr: me,
      billboard,
      billboardAddress: billboard.address,
      keys: {
        exponentKey,
        inverseSlopeKey,
        poolBalanceKey,
        totalSupplyKey,
      }, 
      currentPrice,
    })
  }

  componentDidUpdate() {
    console.log('update');
  }

  async handleBuy() {
    this.state.billboard.methods.mint(String(10**18)).send({
      from: this.state.addr,
      value: await this.state.billboard.methods.priceToMint(String(10**18)).call(),
    });
  }

  async handleSell() {
    this.state.billboard.methods.burn(String(10**18)).send({
      from: this.state.addr,
    });
  }

  render() {
    const { Convergent_Billboard: billboard } = this.props.drizzleState.contracts;

    if (
      !(this.state.keys.totalSupplyKey in billboard.totalSupply)
      || !(this.state.keys.exponentKey in billboard.exponent)) {
      return <span>Still loading...</span>
    }

    return (
      <div className="App">
        <header className="App-header">
        <Tooltip title={this.state.billboardAddress} placement="top" interactive>
          <h1>Convergent Billboard</h1>
        </Tooltip>
          <Chart
            curveData={
              {
                currentPrice: this.state.currentPrice,
                exponent: billboard.exponent[this.state.keys.exponentKey].value,
                inverseSlope: billboard.inverseSlope[this.state.keys.inverseSlopeKey].value,
                poolBalance: billboard.poolBalance[this.state.keys.poolBalanceKey].value,
                totalSupply: billboard.totalSupply[this.state.keys.totalSupplyKey].value,
              }
            }
            height="100%"
            width="100%"
            margin={{ top: 10, bottom: 10, left: 0, right: 50 }}
          />
          {/* <a
            className="App-link"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy This Sign
          </a> */}
          <div>
            <Button color="primary" variant="outlined" onClick={this.handleBuy}>
              Buy
            </Button>
            &nbsp;&nbsp;
            <Button color="secondary" variant="outlined" onClick={this.handleSell}>
              Sell
            </Button>
          </div>
        </header>
      </div>
    );
  }
}

export default withContext(App);
