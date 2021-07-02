import { graphqlRequest } from '../db/connection';
import {
  formFactory,
  fieldFactory,
  conversationMessageFactory
} from '../db/factories';
import { Fields, FieldsGroups, ConversationMessages } from '../db/models';
import { FIELDS_GROUPS_CONTENT_TYPES } from '../db/models/definitions/constants';

import './setup.ts';

describe('formQueries', () => {
  afterEach(async () => {
    // Clearing test data
    await Fields.deleteMany({});
    await FieldsGroups.deleteMany({});
    await ConversationMessages.deleteMany({});
  });

  test('Forms', async () => {
    // Creating test data

    await formFactory();
    await formFactory();

    const qry = `
      query forms {
        forms {
          _id
          title
          code

          createdUser {
            _id
          }

          fields {
            _id
          }
        }
      }
    `;

    // company ===================
    const responses = await graphqlRequest(qry, 'forms');

    expect(responses.length).toBe(2);
    expect(responses[0].title).toBeDefined();
    expect(responses[0].code).toBeDefined();
  });

  test('formDetail', async () => {
    const form = await formFactory({
      title: 'title',
      code: 'code'
    });

    const qry = `
      query formDetail($_id: String!) {
        formDetail(_id: $_id) {
          _id
          title
          code
          createdUser {
            _id
          }
        }
      }
    `;

    const response = await graphqlRequest(qry, 'formDetail', { _id: form._id });
    expect(response.title).toBe('title');
    expect(response.code).toBe('code');
  });

  test('form statistics', async () => {
    const form = await formFactory({
      title: 'title',
      code: 'code'
    });

    const doc = {
      contentType: FIELDS_GROUPS_CONTENT_TYPES.FORM,
      contentTypeId: form._id,
      isVisible: true
    };

    const field1 = await fieldFactory({
      ...doc,
      options: ['test1', 'test2', 'test3']
    });
    const field2 = await fieldFactory({ ...doc, options: ['data', 'value'] });

    const data = {
      type: 'radio',
      validation: null,
      text: 'label',
      column: null
    };

    await conversationMessageFactory({
      customerId: 'customer',
      formWidgetData: [
        { ...data, _id: field1._id, value: 'test1' },
        { ...data, _id: field2._id, value: 'data' }
      ]
    });

    await conversationMessageFactory({
      customerId: 'customer',
      formWidgetData: [
        { ...data, _id: field2._id, value: 'value' },
        { ...data, _id: field2._id, value: 'data' }
      ]
    });

    const qry = `
      query formStatistics($_id: String!) {
        formStatistics(_id: $_id) {
          text
          description
          type
          value
          total
        }
      }
    `;

    const response = await graphqlRequest(qry, 'formStatistics', {
      _id: form._id
    });

    expect(response.length).toBe(2);
    expect(response[0].total).toBe(1);
    expect(response[1].total).toBe(2);
  });
});
