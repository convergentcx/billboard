import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

/** Let's get a little drizzle ! */
import { Drizzle, generateStore } from 'drizzle';
import { DrizzleContext } from "drizzle-react";
import ConvergentBillboard from './build/contracts/Convergent_Billboard.json';

const options = {
  contracts: [ ConvergentBillboard ],
};

const drizzleStore = generateStore(options)
const drizzle = new Drizzle(options, drizzleStore)
/** END drizzle */

const theme = createMuiTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: '#f2f2f2',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      light: '#0066ff',
      main: '#0044ff',
      // dark: will be calculated from palette.secondary.main,
      contrastText: '#ffcc00',
    },
    // error: will use the default color
  },
});

ReactDOM.render(
  <DrizzleContext.Provider drizzle={drizzle}>
    <MuiThemeProvider theme={theme}>
      <App />
    </MuiThemeProvider>
  </DrizzleContext.Provider>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
