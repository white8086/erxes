import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';
import EmptyState from 'modules/common/components/EmptyState';
import { queries } from '../../graphql';
import ChartLine from 'modules/boards/components/chart/ChartLine';
import ChartBar from 'modules/boards/components/chart/ChartBar';
import ChartArea from 'modules/boards/components/chart/ChartArea';
import ChartPie from 'modules/boards/components/chart/ChartPie';
import ChartBarStack from 'modules/boards/components/chart/ChartBarStack';

type Props = {
  pipelineId: string;
  type: string;
  stackBy: string;
  chartType: string;
};

export default function ChartStackContainer({
  pipelineId,
  type,
  stackBy,
  chartType
}: Props) {
  const { data, loading, error } = useQuery(
    gql(queries.itemsCountByAssignedUser),
    {
      variables: {
        pipelineId,
        type,
        stackBy: stackBy || 'stage'
      }
    }
  );

  if (loading) {
    return <div>...</div>;
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  const bars = data.itemsCountByAssignedUser.groups || [];
  const usersWithInfo = data.itemsCountByAssignedUser.usersWithInfo || [];

  if (bars.length === 0) {
    return <EmptyState text="this data is empty" icon="piechart" />;
  }

  if (chartType === 'line') {
    return <ChartLine bars={bars} usersWithInfo={usersWithInfo} />;
  }

  if (chartType === 'bar') {
    return <ChartBar bars={bars} usersWithInfo={usersWithInfo} />;
  }

  if (chartType === 'area') {
    return <ChartArea bars={bars} usersWithInfo={usersWithInfo} />;
  }

  if (chartType === 'pie') {
    return <ChartPie bars={bars} usersWithInfo={usersWithInfo} />;
  }

  return <ChartBarStack bars={bars} usersWithInfo={usersWithInfo} />;
}
