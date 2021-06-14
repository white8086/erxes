import { Forms, Fields, ConversationMessages } from '../../../db/models';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { FIELDS_GROUPS_CONTENT_TYPES } from '../../../db/models/definitions/constants';

const formQueries = {
  /**
   * Forms list
   */
  forms(_root, _args, { commonQuerySelector }: IContext) {
    return Forms.find(commonQuerySelector).sort({ title: 1 });
  },

  async formStatistics(_root, { _id }: { _id: string }) {
    const fields = await Fields.find({
      contentType: FIELDS_GROUPS_CONTENT_TYPES.FORM,
      contentTypeId: _id,
      isVisible: true,
      options: { $exists: true, $ne: [] }
    }).sort({ order: 1 });

    const messageQuery: any = {
      'formWidgetData._id': { $in: fields.map(field => field._id) },
      customerId: { $exists: true }
    };

    const messages = await ConversationMessages.find(messageQuery, {
      formWidgetData: 1,
      customerId: 1,
      createdAt: 1
    });

    const data: any = [];

    fields.map(field => {
      const fieldId = field._id;

      const fieldData = {
        text: field.text,
        description: field.description,
        type: field.type,
        value: {},
        total: 0
      };

      for (const message of messages) {
        const { formWidgetData } = message;
        const wData = formWidgetData.find(d => d._id === fieldId);

        if (wData && wData.value) {
          const value = fieldData.value;

          const count = value[wData.value] ? value[wData.value] + 1 : 1;
          value[wData.value] = count;
        }
      }

      Object.keys(fieldData.value).map(key => {
        fieldData.total = fieldData.total + fieldData.value[key];
      });

      data.push(fieldData);
    });

    return data;
  },

  /**
   * Get one form
   */
  formDetail(_root, { _id }: { _id: string }) {
    return Forms.findOne({ _id });
  }
};

checkPermission(formQueries, 'forms', 'showForms', []);

export default formQueries;
