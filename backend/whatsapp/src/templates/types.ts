export interface TemplateParameter {
  type: 'text';
  text: string;
}

export interface TemplateComponent {
  type: 'body';
  parameters: TemplateParameter[];
}

export interface TemplateMessage {
  name: string;
  language: { code: string };
  components: TemplateComponent[];
}
