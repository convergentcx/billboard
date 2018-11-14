/* eslint-disable no-undef */
import React, { Component } from 'react';
import Web3 from 'web3';

import Chart from './components/Chart/Chart';

import './App.css';

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
    this.state = {
      addr: 'hello_world',
    }
  }

  componentDidMount() {
    window.addEventListener('load', async () => {
      // Modern dapp browsers...
      if (typeof window === 'object' && window.ethereum) {
          window.web3 = new Web3(ethereum);
          try {
              await ethereum.enable();
              this.setState({
                addr: (await window.web3.eth.getAccounts())[0],
              });
          } catch (error) {
              // User denied account access...
          }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
          window.web3 = new Web3(web3.currentProvider);
          // Acccounts always exposed
      }
      // Non-dapp browsers...
      else {
          console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          {/* <h1>Convergent Billboard</h1> */}
          <h2>{this.state.addr}</h2>
          <Chart
            curveData={mockCurveData}
            height="100%"
            width="100%"
            margin={{ top: 10, bottom: 10, left: 0, right: 50 }}
          />
          <a
            className="App-link"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy This Sign
          </a>
        </header>
      </div>
    );
  }
}

export default App;
// export default withContext(App);
