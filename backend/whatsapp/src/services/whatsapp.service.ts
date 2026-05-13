// services/whatsapp.service.ts
import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import { TemplateMessage } from '../templates/types';

const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

function getConfig() {
  return {
    url:     `${GRAPH_BASE}/${env.META_PHONE_NUMBER_ID}/messages`,
    headers: {
      Authorization:  `Bearer ${env.META_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
}

export async function sendTemplate(to: string, template: TemplateMessage): Promise<void> {
  const { url, headers } = getConfig();
  try {
    await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template,
    }, { headers });
  } catch (err) {
    const error = err as AxiosError;
    const detail = error.response?.data ?? error.message;
    throw new Error(`WhatsApp sendTemplate falló para ${to}: ${JSON.stringify(detail)}`);
  }
}

export async function sendText(to: string, body: string): Promise<void> {
  const { url, headers } = getConfig();
  try {
    await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }, { headers });
  } catch (err) {
    const error = err as AxiosError;
    const detail = error.response?.data ?? error.message;
    throw new Error(`WhatsApp sendText falló para ${to}: ${JSON.stringify(detail)}`);
  }
}