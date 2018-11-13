import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

/** Let's get a little drizzle ! */
import { Drizzle, generateStore } from 'drizzle';
import { DrizzleContext } from "drizzle-react";

import ConvergentBillboard from './build/contracts/Convergent_Billboard.json'

const options = {
  contracts: [
    ConvergentBillboard
  ]
}

const drizzleStore = generateStore(options)
const drizzle = new Drizzle(options, drizzleStore)
/** END drizzle */

ReactDOM.render(
  <DrizzleContext.Provider drizzle={drizzle}>
    <App />
  </DrizzleContext.Provider>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
