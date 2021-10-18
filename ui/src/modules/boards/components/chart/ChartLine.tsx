import { LineChart, Line } from 'recharts';

import React from 'react';
import { getColors } from 'modules/boards/utils';
import MainChart from './MainChart';

type Props = {
  bars: any[];
  usersWithInfo: any[];
};

export default function ChartLine({ bars, usersWithInfo }: Props) {
  return (
    <MainChart component={LineChart} data={usersWithInfo}>
      {bars.map((item, index) => (
        <Line
          type="monotone"
          dataKey={item.name}
          stroke={getColors(index)}
          activeDot={{ r: 8 }}
        />
      ))}
    </MainChart>
  );
}
