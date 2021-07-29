import { __ } from 'modules/common/utils';
import LeftSidebar from 'modules/layout/components/Sidebar';
import { SidebarList as List } from 'modules/layout/styles';
import React from 'react';
import { Link } from 'react-router-dom';
import { PROPERTY_GROUPS } from '../constants';
import SidebarHeader from 'modules/settings/common/components/SidebarHeader';
import Box from 'modules/common/components/Box';

type Props = {
  currentType: string;
};

class Sidebar extends React.Component<
  Props,
  { selectedTabIndex: number | null }
> {
  constructor(props) {
    super(props);
    this.state = { selectedTabIndex: 0 };
  }

  renderListItem(group: string, type: string, text: string) {
    const className = this.props.currentType === type ? 'active' : '';

    return (
      <li key={`${group}_${type}`}>
        <Link to={`?type=${type}`} className={className}>
          {__(text)}
        </Link>
      </li>
    );
  }

  renderSideBar() {
    return PROPERTY_GROUPS.map((group, index) => {
      return (
        <Box
          callback={() => {
            console.log(this.state);
            this.setState({
              selectedTabIndex:
                this.state.selectedTabIndex === index ? null : index
            });
          }}
          title={group.value}
          key={group.value}
          accordion={index === this.state.selectedTabIndex}
          name="showFilterBySegments"
        >
          <List key={`list_${group.value}`}>
            {group.types.map(type => {
              return this.renderListItem(group.value, type.value, type.label);
            })}
          </List>
        </Box>
      );
    });
  }

  render() {
    return (
      <LeftSidebar header={<SidebarHeader />} full={true}>
        {this.renderSideBar()}
      </LeftSidebar>
    );
  }
}

export default Sidebar;
