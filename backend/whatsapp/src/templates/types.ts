export interface TemplateParameter {
  type: 'text';
  text: string;
}

export interface TemplateComponent {
  type: 'body';
  parameters: TemplateParameter[];
}

export interface TemplateButtonComponent {
  type: 'button';
  sub_type: 'url';
  index: '0';
  parameters: [{ type: 'text'; text: string }];
}

export interface TemplateMessage {
  name: string;
  language: { code: string };
  components: (TemplateComponent | TemplateButtonComponent)[];
}
