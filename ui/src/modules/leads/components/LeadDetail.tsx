import { __ } from 'modules/common/utils';
import Wrapper from 'modules/layout/components/Wrapper';
import React from 'react';
import { Title, FormWrapper } from '../../engage/styles';
import { ILeadIntegration, LeadChartData } from '../types';
import ProgressBar from 'modules/common/components/ProgressBar';

type Props = {
  integration: ILeadIntegration;
  datas: LeadChartData[];
};

class EmailStatistics extends React.Component<Props> {
  render() {
    const { integration, datas } = this.props;

    const actionBar = (
      <Wrapper.ActionBar left={<Title>{integration.name}</Title>} />
    );

    const content = (
      <FormWrapper>
        {datas.map((data, index) => (
          <div key={index}>
            <h3>{data.text}</h3>
            <span>{data.description}</span>

            {Object.keys(data.value).map((key, i) => {
              const count = data.value[key] || '';

              return (
                <div key={`${key}_${i}`}>
                  <h4>
                    {key} ({count})
                  </h4>
                  <ProgressBar
                    percentage={(parseInt(count, 10) / data.total) * 100}
                    color="#3B85F4"
                    height="8px"
                  />
                </div>
              );
            })}

            <br />
          </div>
        ))}
      </FormWrapper>
    );

    return (
      <Wrapper
        header={
          <Wrapper.Header
            title={__('Show statistics')}
            breadcrumb={[
              { title: __('Forms'), link: '/forms' },
              { title: __('Show statistics') }
            ]}
          />
        }
        actionBar={actionBar}
        content={content}
      />
    );
  }
}

export default EmailStatistics;
