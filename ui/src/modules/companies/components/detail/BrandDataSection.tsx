import dayjs from 'dayjs';
import { IBrandData } from 'erxes-ui/lib/companies/types';
import Box from 'modules/common/components/Box';
import EmptyState from 'modules/common/components/EmptyState';
import { isValidDate } from 'modules/common/utils';
import { FieldStyle, SidebarCounter, SidebarList } from 'modules/layout/styles';
import React from 'react';

type Props = {
  brandData: IBrandData;
  collapseCallback?: () => void;
};

class BrandDataSection extends React.Component<Props> {
  renderCustomValue = (value: string) => {
    if (isValidDate(value)) {
      return dayjs(value).format('lll');
    }

    return value;
  };

  renderContent() {
    const { brandData } = this.props;

    const trackedData = brandData.data || [];

    if (!trackedData || trackedData.length === 0) {
      return <EmptyState icon="folder-2" text="Empty" size="small" />;
    }

    return (
      <SidebarList className="no-link">
        {trackedData.map((data, index) => (
          <li key={index}>
            <FieldStyle>{data.field}</FieldStyle>
            <SidebarCounter>
              {this.renderCustomValue(data.value)}
            </SidebarCounter>
          </li>
        ))}
      </SidebarList>
    );
  }

  render() {
    const { collapseCallback, brandData } = this.props;

    return (
      <Box
        title={brandData.brandName || ''}
        name="showTrackedData"
        callback={collapseCallback}
      >
        {this.renderContent()}
      </Box>
    );
  }
}

export default BrandDataSection;
