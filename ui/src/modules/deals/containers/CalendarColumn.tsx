import gql from 'graphql-tag';
import * as compose from 'lodash.flowright';
import {
  ColumnProps,
  getCommonParams
} from 'modules/boards/components/Calendar';
import { onCalendarLoadMore } from 'modules/boards/utils';
import { IDateColumn } from 'modules/common/types';
import { withProps } from 'modules/common/utils';
import { getMonthTitle } from 'modules/common/utils/calendar';
import CalendarColumn from 'modules/deals/components/CalendarColumn';
import React from 'react';
import { graphql } from 'react-apollo';
import { queries } from '../graphql';
import { DealsQueryResponse, DealsTotalAmountsQueryResponse } from '../types';

type FinalProps = ColumnProps & {
  dealsQuery: DealsQueryResponse;
  dealsTotalAmountsQuery: DealsTotalAmountsQueryResponse;
};

class DealColumnContainer extends React.Component<FinalProps> {
  componentWillReceiveProps(nextProps: FinalProps) {
    const { updatedAt, dealsQuery, dealsTotalAmountsQuery } = this.props;

    if (updatedAt !== nextProps.updatedAt) {
      dealsQuery.refetch();
      dealsTotalAmountsQuery.refetch();
    }
  }

  render() {
    const {
      dealsQuery,
      dealsTotalAmountsQuery,
      date: { month }
    } = this.props;

    const { fetchMore } = dealsQuery;

    // Update calendar after stage updated
    if (localStorage.getItem('cacheInvalidated') === 'true') {
      localStorage.setItem('cacheInvalidated', 'false');

      dealsQuery.refetch();
      dealsTotalAmountsQuery.refetch();
    }

    const title = getMonthTitle(month);
    const deals = dealsQuery.deals || [];
    const dealTotalAmounts = dealsTotalAmountsQuery.dealsTotalAmounts || {
      dealCount: 0,
      dealAmounts: []
    };

    const onLoadMore = (skip: number) => {
      return onCalendarLoadMore(fetchMore, 'deals', skip);
    };

    const updatedProps = {
      ...this.props,
      deals,
      title,
      onLoadMore,
      dealTotalAmounts
    };

    return <CalendarColumn {...updatedProps} />;
  }
}

export default withProps<ColumnProps>(
  compose(
    graphql<
      ColumnProps,
      DealsQueryResponse,
      { skip: number; date: IDateColumn }
    >(gql(queries.deals), {
      name: 'dealsQuery',
      options: ({ date, pipelineId, queryParams }: ColumnProps) => {
        return {
          notifyOnNetworkStatusChange: true,
          variables: {
            skip: 0,
            date,
            pipelineId,
            ...getCommonParams(queryParams)
          }
        };
      }
    }),
    graphql<ColumnProps, DealsTotalAmountsQueryResponse, { date: IDateColumn }>(
      gql(queries.dealsTotalAmounts),
      {
        name: 'dealsTotalAmountsQuery',
        options: ({ date, pipelineId, queryParams }: ColumnProps) => ({
          variables: {
            date,
            pipelineId,
            ...getCommonParams(queryParams)
          }
        })
      }
    )
  )(DealColumnContainer)
);
