import gql from 'graphql-tag';
import * as compose from 'lodash.flowright';
import ButtonMutate from 'modules/common/components/ButtonMutate';
import { IButtonMutateProps } from 'modules/common/types';
import { generatePaginationParams } from 'modules/common/utils/router';
import React from 'react';
import { graphql } from 'react-apollo';
import ArticleForm from '../../components/article/ArticleForm';
import { mutations, queries } from '../../graphql';
import { IArticle, TopicsQueryResponse } from '../../types';
import { LeadIntegrationsQueryResponse } from 'modules/leads/types';
import { queries as leadQueries } from 'modules/leads/graphql';
import { INTEGRATION_KINDS } from 'modules/settings/integrations/constants';

type Props = {
  article: IArticle;
  currentCategoryId: string;
  queryParams: any;
  topicIds: string[];
  closeModal: () => void;
};

type FinalProps = {
  topicsQuery: TopicsQueryResponse;
  leadsQuery: LeadIntegrationsQueryResponse;
} & Props;

const ArticleContainer = (props: FinalProps) => {
  const {
    article,
    queryParams,
    topicIds,
    currentCategoryId,
    topicsQuery,
    leadsQuery
  } = props;

  const renderButton = ({
    name,
    values,
    isSubmitted,
    callback,
    object
  }: IButtonMutateProps) => {
    return (
      <ButtonMutate
        mutation={
          object
            ? mutations.knowledgeBaseArticlesEdit
            : mutations.knowledgeBaseArticlesAdd
        }
        variables={values}
        callback={callback}
        refetchQueries={getRefetchQueries(
          queryParams,
          currentCategoryId,
          topicIds
        )}
        type="submit"
        uppercase={false}
        isSubmitted={isSubmitted}
        successMessage={`You successfully ${
          object ? 'updated' : 'added'
        } an ${name}`}
      />
    );
  };

  const generateFormItems = forms => {
    if (!forms) {
      return;
    }

    const items: Array<{ name: string; value?: string }> = [];

    forms.forEach(field => {
      const { form = {}, brand = {}, name } = field;

      if (!brand.code || !form.code) {
        return;
      }

      return items.push({ value: `${form.code},${brand.code}`, name });
    });

    if (items.length === 0) {
      return;
    }

    return {
      items,
      title: 'Forms',
      label: 'Forms'
    };
  };

  const extendedProps = {
    ...props,
    renderButton,
    article,
    currentCategoryId,
    topics: topicsQuery.knowledgeBaseTopics || [],
    formItems: generateFormItems(leadsQuery.integrations || []),
    loading: topicsQuery.loading || leadsQuery.loading
  };

  return <ArticleForm {...extendedProps} />;
};

const getRefetchQueries = (
  queryParams,
  currentCategoryId: string,
  topicIds: string[]
) => {
  return [
    {
      query: gql(queries.knowledgeBaseArticles),
      variables: {
        ...generatePaginationParams(queryParams),
        categoryIds: [currentCategoryId]
      }
    },
    {
      query: gql(queries.knowledgeBaseCategories),
      variables: { topicIds: [topicIds] }
    },
    {
      query: gql(queries.knowledgeBaseArticlesTotalCount),
      variables: { categoryIds: [currentCategoryId] }
    }
  ];
};

export default compose(
  graphql<Props, TopicsQueryResponse>(gql(queries.knowledgeBaseTopics), {
    name: 'topicsQuery',
    options: () => ({
      fetchPolicy: 'network-only'
    })
  }),
  graphql<Props, LeadIntegrationsQueryResponse>(
    gql(leadQueries.leadIntegrations),
    {
      name: 'leadsQuery',
      options: () => {
        return {
          variables: {
            kind: INTEGRATION_KINDS.FORMS
          }
        };
      }
    }
  )
)(ArticleContainer);
