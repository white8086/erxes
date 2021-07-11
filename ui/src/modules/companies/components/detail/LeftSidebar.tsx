import CustomFieldsSection from 'modules/companies/containers/detail/CustomFieldsSection';
import { ICompany } from 'modules/companies/types';
import TaggerSection from 'modules/customers/components/common/TaggerSection';
import Sidebar from 'modules/layout/components/Sidebar';
import { IField } from 'modules/settings/properties/types';
import React from 'react';
import BasicInfoSection from '../common/BasicInfoSection';
import BrandDataSection from './BrandDataSection';

type Props = {
  company: ICompany;
  taggerRefetchQueries?: any[];
  fields: IField[];
};

class LeftSidebar extends React.Component<Props> {
  renderBrandData() {
    const { company } = this.props;
    const data = company.brandData || [];

    if (data.length === 0) {
      return null;
    }

    // for (const bData of brandData) {

    // }

    return data.map(e => (
      <>
        <BrandDataSection brandData={e} />{' '}
      </>
    ));
  }

  render() {
    const { company, taggerRefetchQueries, fields } = this.props;

    return (
      <Sidebar wide={true}>
        <BasicInfoSection company={company} fields={fields} />
        <CustomFieldsSection company={company} />
        <TaggerSection
          data={company}
          type="company"
          refetchQueries={taggerRefetchQueries}
        />
        {this.renderBrandData()}
      </Sidebar>
    );
  }
}

export default LeftSidebar;
