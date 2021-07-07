import asyncComponent from 'modules/common/components/AsyncComponent';
import queryString from 'query-string';
import React from 'react';
import { Route } from 'react-router-dom';

const AllTemplates = asyncComponent(() =>
  import(
    /* webpackChunkName: "Settings - allTemplates" */ './containers/templateList'
  )
);

const allTemplates = ({ location, history }) => {
  const queryParams = queryString.parse(location.search);
  return <AllTemplates queryParams={queryParams} history={history} />;
};

const routes = () => (
  <Route exact={true} path="/settings/all-templates" component={allTemplates} />
);

export default routes;
