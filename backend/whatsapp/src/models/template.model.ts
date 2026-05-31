/**
 * WhatsApp template message parameter
 */
export interface TemplateParameter {
  type: 'text';
  text: string;
}

/**
 * WhatsApp template body component
 */
export interface TemplateComponent {
  type: 'body';
  parameters: TemplateParameter[];
}

/**
 * WhatsApp template button component with URL
 */
export interface TemplateButtonComponent {
  type: 'button';
  sub_type: 'url';
  index: '0';
  parameters: [{ type: 'text'; text: string }];
}

/**
 * WhatsApp template message structure for Meta API
 */
export interface TemplateMessage {
  name: string;
  language: { code: string };
  components: (TemplateComponent | TemplateButtonComponent)[];
}
