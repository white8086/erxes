import client from 'apolloClient';
import gql from 'graphql-tag';
import EmptyState from 'modules/common/components/EmptyState';
import Spinner from 'modules/common/components/Spinner';
import { withProps } from 'modules/common/utils';
import { queries as fieldQueries } from 'modules/settings/properties/graphql';
import { IField } from 'modules/settings/properties/types';
import React from 'react';
import CustomerDetails from '../components/detail/CustomerDetails';
import { queries } from '../graphql';
import { CustomerDetailQueryResponse, ICustomer } from '../types';

type Props = {
  id: string;
};

type FinalProps = {
  customerDetailQuery: CustomerDetailQueryResponse;
} & Props;

type State = {
  customer: ICustomer;
  loading: boolean;
  fields: IField[];
};

class CustomerDetailsContainer extends React.Component<FinalProps, State> {
  constructor(props) {
    super(props);

    this.state = {
      customer: {} as ICustomer,
      loading: true,
      fields: [] as IField[]
    };
  }

  componentDidMount() {
    const { id } = this.props;
    this.setState({ loading: true });

    client
      .query({
        query: gql(queries.customerDetail),
        fetchPolicy: 'network-only',
        variables: { _id: id }
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

  render() {
    const { id } = this.props;
    const { loading, customer } = this.state;

    if (loading) {
      return <Spinner objective={true} />;
    }

    if (!customer) {
      return (
        <EmptyState text="Customer not found" image="/images/actions/17.svg" />
      );
    }

    const taggerRefetchQueries = [
      {
        query: gql(queries.customerDetail),
        variables: { _id: id }
      }
    ];

    const updatedProps = {
      ...this.props,
      customer: this.state.customer,
      taggerRefetchQueries,
      fields: this.state.fields
    };

    return <CustomerDetails {...updatedProps} />;
  }
}

export default withProps<Props>(CustomerDetailsContainer);
