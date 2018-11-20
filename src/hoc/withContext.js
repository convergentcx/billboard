import React from 'react';
import { DrizzleContext } from 'drizzle-react';

const withContext = WrappedComponent => props =>
  <DrizzleContext.Consumer>
    {drizzleContext => {
      const { drizzle, drizzleState, initialized } = drizzleContext;
      if (!initialized) {
        return <main style={{ backgroundColor: 'white', display: 'flex', flexFlow: 'column wrap', height: '100vh' }}>
          <div style={{ background: 'white', display: 'flex', justifyContent: 'center' }}>
            <h1>⚠️</h1>
          </div>
          <div style={{ backgroundColor: 'white', paddingLeft: '25%', paddingRight: '25%', display: 'flex', justifyContent: 'center' }}>
            <p>
            <center>No Ethereum connection found!</center>
            <br /><br />
            <center>Please install <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">Metamask</a> or use the <a href="https://brave.com/download/" target="_blank" rel="noopener noreferrer">Brave</a> browser 
            with Metamask installed.</center>
            <br /><br />
            <center>Make sure you're connected to Mainnet or the Rinkeby test network.</center>
            </p>
          </div>
        </main>;
      }

      return (
        <WrappedComponent {...props} drizzle={drizzle} drizzleState={drizzleState}/>
      );
    }}
  </DrizzleContext.Consumer>
    
export default withContext;
