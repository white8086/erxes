import { Document, Model, model, Schema } from 'mongoose';
import { field } from '../models/utils';

// customer ======================
export interface ICustomer {
  psid: string;
  integrationId: string;
  // id on erxes-api
  erxesApiId?: string;
}

export interface ICustomerDocument extends ICustomer, Document {}

export const customerSchema = new Schema({
  _id: field({ pkey: true }),
  psid: { type: String, unique: true },
  integrationId: String,
  erxesApiId: String
});

export interface ICustomerModel extends Model<ICustomerDocument> {}

// conversation ===========================
export interface IConversation {
  // id on erxes-api
  erxesApiId?: string;
  timestamp: Date;
  psid: string;
  integrationId: string;
}

export interface IConversationDocument extends IConversation, Document {}

export const conversationSchema = new Schema({
  _id: field({ pkey: true }),
  erxesApiId: String,
  timestamp: Date,
  integrationId: String,
  psid: { type: String, index: true }
});

export interface IConversationModel extends Model<IConversationDocument> {}

// conversation message ===========================
export interface IConversationMessage {
  content: string;
  conversationId: string;
  botData: {};
}

export interface IConversationMessageDocument
  extends IConversationMessage,
    Document {}

export const conversationMessageSchema = new Schema({
  _id: field({ pkey: true }),
  content: String,
  conversationId: String,
  botData: {}
});

export interface IConversationMessageModel
  extends Model<IConversationMessageDocument> {}

// tslint:disable-next-line
export const Customers = model<ICustomerDocument, ICustomerModel>(
  'customers_chatbotmn',
  customerSchema
);

// tslint:disable-next-line
export const Conversations = model<IConversationDocument, IConversationModel>(
  'conversations_chatbotmn',
  conversationSchema
);

// tslint:disable-next-line
export const ConversationMessages = model<
  IConversationMessageDocument,
  IConversationMessageModel
>('conversation_messages_chatbotmn', conversationMessageSchema);
