import gql from 'graphql-tag';
import * as compose from 'lodash.flowright';
import { withProps } from 'modules/common/utils';
import React from 'react';
import { graphql } from 'react-apollo';
import { IEngageScheduleDate, IViberMessage } from '../types';
import { queries } from 'modules/settings/integrations/graphql';
import { IntegrationsQueryResponse } from 'modules/settings/integrations/types';
import ViberForm from '../components/ViberForm';

type Props = {
  onChange: (
    name: 'viber' | 'scheduleDate',
    value?: IViberMessage | IEngageScheduleDate
  ) => void;
  messageKind: string;
  viber: IViberMessage;
  content: string;
  scheduleDate: IEngageScheduleDate;
  isSaved?: boolean;
};

type FinalProps = {
  integrationsQueries: IntegrationsQueryResponse;
} & Props;

const ViberFormContainer = (props: FinalProps) => {
  const { integrationsQueries } = props;

  const updatedProps = {
    ...props,
    integrations: integrationsQueries.integrations || []
  };

  return <ViberForm {...updatedProps} />;
};

export default withProps<Props>(
  compose(
    graphql<Props, IntegrationsQueryResponse>(gql(queries.integrations), {
      name: 'integrationsQueries',
      options: {
        variables: {
          kind: 'messaging-api-viber'
        }
      }
    })
  )(ViberFormContainer)
);
