import axios, { AxiosError } from 'axios';
import { env } from '../../config/env';
import type { TemplateMessage } from '../../models/template.model';

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

/**
 * Sends a WhatsApp template message via Meta API
 */
export async function sendTemplate(to: string, template: TemplateMessage): Promise<void> {
  if (env.WHATSAPP_SIMULATION) {
    console.log('[SIMULATION WhatsApp] sendTemplate', JSON.stringify({ to, template }, null, 2));
    return;
  }

  const { url, headers } = getConfig();
  try {
    await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template,
    }, { headers });
    console.log(
      `[WhatsApp] sent ${template.name} (${template.language.code}) → ${to}`,
    );
  } catch (err) {
    const error = err as AxiosError;
    const detail = error.response?.data ?? error.message;
    throw new Error(`WhatsApp sendTemplate failed for ${to}: ${JSON.stringify(detail)}`);
  }
}

/**
 * Sends a plain text WhatsApp message via Meta API
 */
export async function sendText(to: string, body: string): Promise<void> {
  if (env.WHATSAPP_SIMULATION) {
    console.log('[SIMULATION WhatsApp] sendText', JSON.stringify({ to, body }, null, 2));
    return;
  }

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
    throw new Error(`WhatsApp sendText failed for ${to}: ${JSON.stringify(detail)}`);
  }
}
