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
  constructor(props) {
    super(props);
    this.handleBuy = this.handleBuy.bind(this);
    this.handleSell = this.handleSell.bind(this);
    this.state = {
      addr: 'hello_world',
      billboard: {},
      billboardAddress: 'unavailable',
      curveData: mockCurveData,
    }
  }

  async componentDidMount() {
    const { contracts, store, web3 } = this.props.drizzle;
    const { Convergent_Billboard: billboard } = contracts;
    const me = (await web3.eth.getAccounts())[0];

    // const state = store.getState();
    // const exponentKey = billboard.methods.exponent.cacheCall();

    // console.log(state.contracts.Convergent_Billboard)
    const curveData = {
      exponent: await billboard.methods.exponent().call(),
      inverseSlope: await billboard.methods.inverseSlope().call(),
      poolBalance: await billboard.methods.poolBalance().call(),
      totalSupply: await billboard.methods.totalSupply().call(),
    }
    const currentPrice = (1 / curveData.inverseSlope) * (curveData.totalSupply) ** curveData.exponent;

    Object.assign(curveData, { currentPrice });

    this.setState({
      addr: me,
      billboard,
      billboardAddress: billboard.address,
      curveData
    })
  }

  componentDidUpdate() {
    console.log(this.state.curveData);
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
    return (
      <div className="App">
        <header className="App-header">
        <Tooltip title={this.state.billboardAddress} placement="top" interactive>
          <h1>Convergent Billboard</h1>
        </Tooltip>
          <Chart
            curveData={this.state.curveData}
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
