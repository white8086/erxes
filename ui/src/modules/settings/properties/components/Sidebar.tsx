import CollapseContent from 'modules/common/components/CollapseContent';
import { __ } from 'modules/common/utils';
import LeftSidebar from 'modules/layout/components/Sidebar';
import { SidebarList as List } from 'modules/layout/styles';
import React from 'react';
import { Link } from 'react-router-dom';
import { FIELDS_GROUPS_CONTENT_TYPES } from '../constants';

type Props = {
  currentType: string;
  title: string;
};

class Sidebar extends React.Component<Props> {
  renderSidebarHeader = () => {
    const { title } = this.props;
    const { Header } = LeftSidebar;

    return <Header uppercase={true}>{__(title)}</Header>;
  };

  getClassName(type) {
    const { currentType } = this.props;

    if (type === currentType) {
      return 'active';
    }

    return '';
  }

  renderListItem(type: string, text: string) {
    return (
      <li>
        <Link to={`?type=${type}`} className={this.getClassName(type)}>
          {__(text)}
        </Link>
      </li>
    );
  }

  render() {
    return (
      <LeftSidebar header={this.renderSidebarHeader()}>
        <CollapseContent title={__('Team Inbox')} compact={true}>

          <List>
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.CUSTOMER,
              'Customers'
            )}
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.COMPANY,
              'Companies'
            )}
          </List>

        </CollapseContent>
        <CollapseContent title={__('Tickets')} compact={true}>

          <List>
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.CUSTOMER,
              'Ticket'
            )}
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.PRODUCT,
              'Product & Service'
            )}
          </List>
        </CollapseContent>
        <CollapseContent title={__('Tasks')} compact={true}>

          <List>
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.CUSTOMER,
              'Task'
            )}
          </List>
        </CollapseContent>
        <CollapseContent title={__('Sales pipeline')} compact={true}>

          <List>
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.CUSTOMER,
              'Deal'
            )}
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.PRODUCT,
              'Product & Service'
            )}
          </List>
        </CollapseContent>
        <CollapseContent title={__('Contacts')} compact={true}>

          <List>
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.CUSTOMER,
              'Customers'
            )}
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.COMPANY,
              'Companies'
            )}
            {this.renderListItem(
              FIELDS_GROUPS_CONTENT_TYPES.PRODUCT,
              'Product & Service'
            )}
          </List>
        </CollapseContent>
      </LeftSidebar>
    );
  }
}

export default Sidebar;
