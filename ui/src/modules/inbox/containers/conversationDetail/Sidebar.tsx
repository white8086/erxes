import client from 'apolloClient';
import gql from 'graphql-tag';
import * as compose from 'lodash.flowright';
import withCurrentUser from 'modules/auth/containers/withCurrentUser';
import { IUser } from 'modules/auth/types';
import DumbSidebar from 'modules/inbox/components/conversationDetail/sidebar/Sidebar';
import { queries } from 'modules/inbox/graphql';
// import { FIELDS_GROUPS_CONTENT_TYPES } from 'modules/settings/properties/constants';
import { queries as fieldQueries } from 'modules/settings/properties/graphql';
import { IField } from 'modules/settings/properties/types';
// import { FieldsGroupsQueryResponse } from 'modules/settings/properties/types';
import React from 'react';
import { graphql } from 'react-apollo';
import { withProps } from '../../../common/utils';
import {
  CustomerDetailQueryResponse,
  ICustomer
} from '../../../customers/types';
import { IConversation } from '../../types';
import { getConfig } from '../../utils';

type Props = {
  conversation: IConversation;
};

type FinalProps = {
  customerDetailQuery: CustomerDetailQueryResponse;
  currentUser: IUser;
} & Props;

type State = {
  customer: ICustomer;
  loading: boolean;
  fields: IField[];
};

const STORAGE_KEY = `erxes_sidebar_section_config`;

class Sidebar extends React.Component<FinalProps, State> {
  constructor(props) {
    super(props);

    this.state = {
      customer: {} as ICustomer,
      loading: false,
      fields: [] as IField[]
    };
  }

  componentDidMount() {
    this.getCustomerDetail(this.props.conversation.customerId);
  }

  componentWillReceiveProps(nextProps) {
    const currentDetail = this.props.customerDetailQuery;
    const nextDetail = nextProps.customerDetailQuery;

    const current = currentDetail.customerDetail || {};
    const next = nextDetail.customerDetail || {};

    if (JSON.stringify(current) !== JSON.stringify(next)) {
      this.getCustomerDetail(next._id);
    }
  }

  getCustomerDetail(customerId?: string) {
    if (!customerId) {
      return null;
    }

    const sectionParams = getConfig(STORAGE_KEY);

    this.setState({ loading: true });

    client
      .query({
        query: gql(queries.generateCustomerDetailQuery(sectionParams)),
        fetchPolicy: 'network-only',
        variables: { _id: customerId }
      })
      .then(({ data }: { data: any }) => {
        if (data && data.customerDetail) {
          this.setState({ customer: data.customerDetail, loading: false });

          client
            .query({
              query: gql(fieldQueries.getDefaulFieldsGroup),
              fetchPolicy: 'network-only',
              variables: { contentType: data.customerDetail.state }
            })
            .then(fieldsGroups => {
              const fieldsGroupsData = fieldsGroups.data;

              if (fieldsGroupsData && fieldsGroupsData.getDefaulFieldsGroup) {
                const { fields } = fieldsGroupsData.getDefaulFieldsGroup;
                this.setState({ fields, loading: false });
              }
            });
        }
      })
      .catch(error => {
        console.log(error.message); // tslint:disable-line
      });

    return;
  }

  toggleSection = (): void => {
    const customerId = this.props.conversation.customerId;

    this.getCustomerDetail(customerId);
  };

  render() {
    const { customer, loading, fields } = this.state;

    const taggerRefetchQueries = [
      {
        query: gql(queries.generateCustomerDetailQuery(getConfig(STORAGE_KEY))),
        variables: { _id: customer._id }
      }
    ];

    const updatedProps = {
      ...this.props,
      customer,
      loading,
      toggleSection: this.toggleSection,
      taggerRefetchQueries,
      fields
    };

    return <DumbSidebar {...updatedProps} />;
  }
}

export default withProps<Props>(
  compose(
    graphql<Props, CustomerDetailQueryResponse, { _id?: string }>(
      gql(queries.generateCustomerDetailQuery(getConfig(STORAGE_KEY))),
      {
        name: 'customerDetailQuery',
        options: ({ conversation }) => ({
          variables: {
            _id: conversation.customerId
          }
        })
      }
    )
  )(withCurrentUser(Sidebar))
);
