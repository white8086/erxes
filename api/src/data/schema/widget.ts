export const types = `
  type MessengerConnectResponse {
    integrationId: String
    uiOptions: JSON
    languageCode: String
    messengerData: JSON
    customerId: String
    visitorId: String
    brand: Brand
  }

  type ConversationDetailResponse {
    _id: String
    messages: [ConversationMessage]
    operatorStatus: String
    participatedUsers: [User]
    isOnline: Boolean
    supporters: [User]
  }

  type FormConnectResponse {
    integration: Integration
    form: Form
  }

  type SaveFormResponse {
    status: String!
    errors: [Error]
    messageId: String
    customerId: String
  }

  type Error {
    fieldId: String
    code: String
    text: String
  }

  type MessengerSupportersResponse {
    supporters: [User]
    isOnline: Boolean
    serverTime: String
  }

  input FieldValueInput {
    _id: String!
    type: String
    validation: String
    text: String
    value: JSON
    associatedFieldId: String
    stageId: String
    groupId: String
    column: Int
  }
`;

export const queries = `
  widgetsConversations(integrationId: String!, customerId: String, visitorId: String): [Conversation]
  widgetsConversationDetail(_id: String, integrationId: String!): ConversationDetailResponse
  widgetsGetMessengerIntegration(brandCode: String!): Integration
  widgetsMessages(conversationId: String): [ConversationMessage]
  widgetsUnreadCount(conversationId: String): Int
  widgetsTotalUnreadCount(integrationId: String!, customerId: String, visitorId: String): Int
  widgetsMessengerSupporters(integrationId: String!): MessengerSupportersResponse
  widgetsKnowledgeBaseArticles(topicId: String!, searchString: String) : [KnowledgeBaseArticle]
  widgetsKnowledgeBaseTopicDetail(_id: String!): KnowledgeBaseTopic
  widgetsGetEngageMessage(integrationId: String, customerId: String, visitorId: String, browserInfo: JSON!): ConversationMessage

  widgetsForumTopicDetail(_id: String!): ForumTopic
  widgetsForumDiscussionDetail(_id: String! currentCustomerId: String): ForumDiscussion
  widgetsDiscussionComments(discussionId: String!): [ForumDiscussionComment]
  
  widgetsForumTagsWithParent(parentId: String!): [Tag] 
`;

const forumMutationParams = `
    title: String
    description: String
    languageCode: String
    brandId: String!
    createdBy: String!
`;

const topicMutationParams = `
    title: String
    description: String
    forumId: String!
    discussionIds: [String]
    createdBy: String!
`;

const discussionMutationParams = `
    title: String
    description: String
    topicId: String!
    forumId: String!
    content: String!
    status: String
    startDate: Date
    closeDate: Date
    isComplete: Boolean
    createdBy: String!
    tagIds: [String]
    attachments: [JSON]
    pollOptions: [String]
`;

const commentMutationParams = `
    title: String
    content: String!
    discussionId: String!
    createdBy: String!
`;

const forumReactionMutationParams = `
    type: String!
    createdBy: String!
    contentTypeId: String!
    contentType: String!
`;

const widgetsCustomerMutationParams = `
    firstName: String
    lastName: String
    phone: String
    avatar: String
`;

export const mutations = `
  widgetsMessengerConnect(
    brandCode: String!
    email: String
    phone: String
    code: String
    isUser: Boolean

    companyData: JSON
    data: JSON

    visitorId: String
    cachedCustomerId: String
    deviceToken: String
  ): MessengerConnectResponse

  widgetsSaveBrowserInfo(
    visitorId: String
    customerId: String
    browserInfo: JSON!
  ): ConversationMessage

  widgetsInsertMessage(
    integrationId: String!
    customerId: String
    visitorId: String
    conversationId: String
    message: String,
    attachments: [AttachmentInput],
    contentType: String,
    skillId: String
  ): ConversationMessage

  widgetBotRequest(
    customerId: String
    visitorId: String
    conversationId: String
    integrationId: String!,
    message: String!
    payload: String!
    type: String!
    ): JSON

  widgetsReadConversationMessages(conversationId: String): JSON
  widgetsSaveCustomerGetNotified(customerId: String, visitorId: String, type: String!, value: String!): JSON

  widgetsLeadConnect(
    brandCode: String!,
    formCode: String!,
    cachedCustomerId: String
  ): FormConnectResponse

  widgetsSaveLead(
    integrationId: String!
    formId: String!
    submissions: [FieldValueInput]
    browserInfo: JSON!
    cachedCustomerId: String
  ): SaveFormResponse

  widgetsSendEmail(
    toEmails: [String]
    fromEmail: String
    title: String
    content: String
    customerId: String
    formId: String
    attachments: [AttachmentInput]
  ): String

  widgetGetBotInitialMessage(integrationId: String): JSON

  widgetsKnowledgebaseIncReactionCount(articleId: String!, reactionChoice: String!): String
  widgetsLeadIncreaseViewCount(formId: String!): JSON
  widgetsSendTypingInfo(conversationId: String!, text: String): String

  widgetsForumsAdd(${forumMutationParams}): Forum
  widgetsForumTopicsAdd(${topicMutationParams}): ForumTopic
  widgetsForumDiscussionAdd(${discussionMutationParams}): ForumDiscussion
  
  widgetsDiscussionCommentsAdd(${commentMutationParams}): ForumDiscussionComment
  widgetsForumReactionsToggle(${forumReactionMutationParams}): JSON
  widgetsEditCustomer(_id: String!, ${widgetsCustomerMutationParams}): Customer

  widgetsForumDiscussionsRemove(_id: String!): JSON
  widgetsForumDiscussionsVote(discussionId: String!, customerId: String!, value: String!): ForumDiscussion
`;
