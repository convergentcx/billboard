import React, { Component } from 'react';

import Chart from './components/Chart/Chart';

import './App.css';

const mockCurveData = {
  currentPrice: 10,
  exponent: 1,
  inverseSlope: 1000,
  poolBalance: 23,
  totalSupply: 10000,
};

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Convergent Billboard</h1>
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
