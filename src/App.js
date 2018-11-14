/* eslint-disable no-undef */
import React, { Component } from 'react';
// import Web3 from 'web3';

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
    this.state = {
      addr: 'hello_world',
      bill: 'one'
    }
  }

  async componentDidMount() {
    const { contracts, web3 } = this.props.drizzle;
    console.log(contracts.Convergent_Billboard.address);
    const me = (await web3.eth.getAccounts())[0]
    this.setState({
      addr: me,
      bill: 'two'
    })
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          {/* <h1>Convergent Billboard</h1> */}
          <h2>{this.state.addr}</h2>
          <h2>{this.state.bill}</h2>
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

// export default App;
export default withContext(App);
