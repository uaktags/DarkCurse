import { Request, Response } from 'express';
import { marked } from 'marked';
import { PageAlert } from '../../../types/typings';
import { MessageData } from '../../daos/user';

async function renderPage(
  req: Request,
  res: Response,
  page: string,
  pageTitle: string,
  menu_link: string,
  messageData: MessageData,
  alert?: PageAlert
) {
  const messagesDb = await req.daoFactory?.user.fetchMessages(req.user.id);
  const message = messageData
    ? {
        ...messageData,
        body: marked.parse(messageData.body),
      }
    : null;

  return res.render(`page/main/inbox/${page}`, {
    layout: 'main',
    pageTitle,
    sidebarData: req.sidebarData,
    menu_category: 'home',
    menu_link,
    userDataFiltered: await req.user.formatUsersStats(req.user),
    messages: messagesDb,
    message,
    action: messageData ? 'reply' : 'compose',
    ActionMessage: messageData ? 'Reply' : 'Compose New',
  });
}

async function inboxPage(req: Request, res: Response, alert?: PageAlert) {
  return renderPage(req, res, 'inbox', 'Inbox', 'inbox', null);
}

async function composePage(req: Request, res: Response, alert?: PageAlert) {
  const recipientId = parseInt(req.params.recipientId ?? '0');
  const recipient =
    recipientId > 0 ? await req.daoFactory?.user.fetchById(recipientId) : null;

  return renderPage(
    req,
    res,
    'compose',
    'Compose',
    'inbox',
    recipient
      ? {
          id: 0,
          subject: '',
          body: '',
          from_user: await req.daoFactory?.user.fetchById(req.user.id),
          to_user: recipient,
          date_time: new Date().toString(),
        }
      : null
  );
}

async function readPage(req: Request, res: Response, alert?: PageAlert) {
  const messageId = parseInt(req.params.msgId ?? '0');
  const message = messageId
    ? await req.daoFactory?.user.fetchMessageById(messageId)
    : null;

  return renderPage(req, res, 'readmessage', 'Read Message', 'inbox', message);
}

async function replyPage(req: Request, res: Response, alert?: PageAlert) {
  const messageId = parseInt(req.params.msgId ?? '0');
  const message = messageId
    ? await req.daoFactory?.user.fetchMessageById(messageId)
    : null;

  return renderPage(
    req,
    res,
    'compose',
    'Reply',
    'inbox',
    message
      ? {
          id: 0,
          subject: `Re: ${message.subject}`,
          body: '',
          from_user: await req.daoFactory?.user.fetchById(req.user.id),
          to_user: message.from_user,
          date_time: new Date().toString(),
        }
      : null
  );
}

async function handleDelivery(req: Request, res: Response) {
  const { message_id } = req.params;
}

export default { inboxPage, composePage, readPage, replyPage };
