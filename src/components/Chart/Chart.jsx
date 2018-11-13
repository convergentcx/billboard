import React, { Component } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Label,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import * as d3 from 'd3';

export default class Chart extends Component {

  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount() {
    const context = d3.select(this.ref);
    
    context.append("svg:pattern")
    .attr("id", "rainbow")
    .attr("width", 450)
    .attr("height", 450)
    .attr("patternUnits", "userSpaceOnUse")
    .append("svg:image")
    .attr("xlink:href", 'https://media.giphy.com/media/JQXdEMRPz9sUU/giphy.gif')
    .attr("width", 450)
    .attr("height", 450)
    .attr("x", 0)
    .attr("y", 0);
  }
  
  getChartData() {
    let { totalSupply, poolBalance, inverseSlope, exponent, currentPrice } = this.props.curveData;
    poolBalance = parseFloat(poolBalance) || 0;
    totalSupply = parseFloat(totalSupply) || 0;

    let currentPoint = { supply: totalSupply, value: currentPrice };

    let data = [];
    let step = (totalSupply || 50) / 100;

    for (let i = step; i < (totalSupply || 50) * 1.5; i += step) {
      let price = 1 / inverseSlope * (i ** exponent);
      if (i < totalSupply) {
        data.push({ supply: i, sell: price.toFixed(4), value: parseFloat(price.toFixed(4)) });
      } else if (i >= totalSupply) {
        data.push({ supply: i, buy: price.toFixed(4), value: parseFloat(price.toFixed(4)) });
      }
    }
    return { data, currentPoint };
  }

  render () {
    let { data, currentPoint } = this.getChartData();

    const { height, width } = this.props;

    return (
      <div style={{ height: "70vh", width: "90vw"}}>
      <ResponsiveContainer height={height} width={width}>
        <ComposedChart
          data={data}
          margin={this.props.margin}
          style={{ margin: 'auto' }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="supply" type={ 'number' }>
            {/* <Label value="Token Supply" position = "insideBottomRight" dy={20}/> */}
          </XAxis>
          <YAxis dataKey="value" type={ 'number' }>
            {/* <Label value="Token Price" position="insideTopLeft" style={{ textAnchor: 'right' }} angle={270} dy={100} offset={-20} /> */}
          </YAxis>
          <Tooltip/>
          <Area isAnimationActive={false} dots={false} stackOffset={'none'} dataKey="value" name={'price'} key={'price'} stroke='#0095b3' fill='none'/>
          <Area
            isAnimationActive={false}
            stackOffset={'none'} 
            dataKey="sell" 
            stroke="#0095b3"
            fill='url(#rainbow)'
          />
          <ReferenceDot
            isFront={true}
            ifOverflow="extendDomain"
            x={currentPoint.supply}
            y={currentPoint.value}
            r={4}
            stroke="#0095b3"
          >
            <Label value={currentPoint.value.toFixed(2)}
              position="top"
            />
          </ReferenceDot>
        </ComposedChart>
      </ResponsiveContainer>
      <svg ref={(ref) => this.ref = ref} />
      </div>
    );
  }
}
