import React, { Component } from 'react';
import {
  Area,
  CartesianGrid,
  AreaChart,
  Label,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import * as d3 from 'd3';

import {
  addDecimals,
  removeDecimals,
} from '../../utils';

import { utils } from 'web3';

export default class Chart extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount() {
    const context = d3.select(this.ref);
    
    context.append("svg:pattern")
    .attr("id", "rainbow")
    .attr("width", 200)
    .attr("height", 200)
    .attr("patternUnits", "userSpaceOnUse")
    .append("svg:image")
    .attr("xlink:href", 'https://hack.longhash.com/static/media/aboutpic@2x.b02d4782.png')
    // .attr("xlink:href", 'https://media.giphy.com/media/26AHG5KGFxSkUWw1i/giphy.gif')
    .attr("width", 200)
    .attr("height", 200)
    .attr("x", 0)
    .attr("y", 0);
  }
  
  getChartData() {
    let { 
      currentPrice,
      exponent,
      inverseSlope,
      poolBalance,
      totalSupply,
    } = this.props.curveData;

    poolBalance = utils.toBN(poolBalance);
    totalSupply = utils.toBN(totalSupply);

    const currentPoint = {
      X: removeDecimals(totalSupply.toString()),
      y: removeDecimals(currentPrice.toString()),
    };

    let data = [
      {supply: 0, sell: 0, value: 0}
    ];

    const step = utils.toBN(10**18);
    for (let i = step; i.lte(utils.toBN(500).mul(step)); i = i.add(step)) {
      const price = utils.toBN(1 / inverseSlope * (i ** exponent));
      if (i.lt(totalSupply)) {
        data.push({ supply: parseFloat(removeDecimals(i)).toFixed(4), sell: parseFloat(removeDecimals(price)).toFixed(4), value: parseFloat(removeDecimals(price)).toFixed(4) });
      } else if (i.gte(totalSupply)) {
        data.push({ supply: parseFloat(removeDecimals(i)).toFixed(4), buy: parseFloat(removeDecimals(price)).toFixed(4), value: parseFloat(removeDecimals(price)).toFixed(4) });
      }
    }

    return {
      data, 
      currentPoint,
    };
  }

  render () {
    let { data, currentPoint } = this.getChartData();

    const { height, width } = this.props;
    console.log(data)
    return (
      <div style={{ height: "70vh", width: "90vw"}}>
      <ResponsiveContainer height={height} width={width}>
        <AreaChart
          data={data}
          margin={this.props.margin}
          style={{ margin: 'auto' }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="supply" type={ 'number' } domain={[0, 9]} allowDataOverflow>
            {/* <Label value="Token Supply" position = "bottom" dy={0}/> */}
          </XAxis>
            {/* <Label value="Token Price" position="insideTopLeft" style={{ textAnchor: 'right' }} angle={270} dy={100} offset={-20} /> */}
          <YAxis dataKey="value" type={ 'number' } domain={[0, 0.008]} allowDataOverflow>
          </YAxis>
          <Tooltip />
          <Area isAnimationActive={false} dots={false} stackOffset={'none'} dataKey="value" name={'price'} key={'price'} stroke='#0095b3' fill='none'/>
          <Area
            isAnimationActive={false}
            stackOffset={'none'} 
            dataKey="sell" 
            stroke="#0095b3"
            // fill='blue'
            fill='url(#rainbow)'
          />
          <ReferenceDot
            isFront={true}
            ifOverflow="extendDomain"
            x={currentPoint.x}
            y={currentPoint.y}
            r={4}
            stroke="#0095b3"
          >
            <Label value={currentPoint.y}
              position="top"
            />
          </ReferenceDot>
        </AreaChart>
      </ResponsiveContainer>
      <svg ref={(ref) => this.ref = ref} />
      </div>
    );
  }
}
