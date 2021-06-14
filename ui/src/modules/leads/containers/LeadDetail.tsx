import gql from 'graphql-tag';
import * as compose from 'lodash.flowright';
import { withProps } from 'modules/common/utils';
import { LeadIntegrationDetailQueryResponse } from 'modules/settings/integrations/types';
import React from 'react';
import { graphql } from 'react-apollo';
import { withRouter } from 'react-router-dom';
import { IRouterProps } from '../../common/types';
import LeadDetail from '../components/LeadDetail';
import { queries } from '../graphql';

type Props = {
  contentTypeId: string;
  formId: string;
  queryParams: any;
};

type FinalProps = {
  integrationDetailQuery: LeadIntegrationDetailQueryResponse;
  integrationStatQuery: any;
} & Props &
  IRouterProps;

class LeadDetailContainer extends React.Component<FinalProps> {
  render() {
    const { integrationDetailQuery, integrationStatQuery } = this.props;

    if (integrationDetailQuery.loading || integrationStatQuery.loading) {
      return false;
    }

    const integration = integrationDetailQuery.integrationDetail || {};

    const updatedProps = {
      ...this.props,
      integration,
      datas: integrationStatQuery.formStatistics || []
    };

    return <LeadDetail {...updatedProps} />;
  }
}

export default withProps<FinalProps>(
  compose(
    graphql<Props, LeadIntegrationDetailQueryResponse, { _id: string }>(
      gql(queries.integrationDetail),
      {
        name: 'integrationDetailQuery',
        options: ({ contentTypeId }) => ({
          variables: {
            _id: contentTypeId
          }
        })
      }
    ),
    graphql<Props, any, { _id: string }>(gql(queries.formStatistics), {
      name: 'integrationStatQuery',
      options: ({ formId }) => ({
        variables: {
          _id: formId
        }
      })
    })
  )(withRouter<FinalProps>(LeadDetailContainer))
);
