export type Rule = { field: string; op: string; value: string };
export type Condition = { logic: 'all' | 'any'; rules: Rule[] } | null;

export type FieldBase = { id: string; showIf?: Condition };
export type PageField = FieldBase & { kind: 'page' };
export type HtmlField = FieldBase & { kind: 'html'; html: string };
export type VideoField = FieldBase & { kind: 'video'; aparatHash: string };
export type InputField = FieldBase & {
  kind: 'text' | 'email' | 'number' | 'tel';
  label: string;
  placeholder?: string;
  required?: boolean;
  adminLabel?: string;
};
export type RadioField = FieldBase & {
  kind: 'radio';
  label: string;
  required?: boolean;
  adminLabel?: string;
  choices: { label: string; value: string }[];
};
export type SmartField = PageField | HtmlField | VideoField | InputField | RadioField;

export type SmartForm = { id: string; title: string; fields: SmartField[] };
export type FormsBundle = Record<string, SmartForm>;

export type Answers = Record<string, string>;
