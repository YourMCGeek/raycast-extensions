export interface Alert {
  caused_member_id: number;
  content_type: string;
  content_id: number;
  alert_type: string;
  alert_date: number;
  username?: string;
}

export enum AlertType {
  REACTION = "reaction",
  REPLY = "insert",
}

export enum ContentType {
  CONVERSATION = "conversation_message",
  TICKET = "nf_tickets_message",
  THREAD = "post",
}

export const ContentTypeURLMap: { [key in ContentType]: string } = {
  [ContentType.CONVERSATION]: "https://builtbybit.com/conversations/messages",
  [ContentType.TICKET]: "https://builtbybit.com/tickets/messages",
  [ContentType.THREAD]: "https://builtbybit.com/posts",
};
