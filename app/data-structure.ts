export interface Link {
  file: string;
  content: string;
}

export interface Links {
  links: Link[];
}

export interface CheckResult {
  isLawQuestion: boolean;
}

export interface QaResult {
  answer: string;
  links: string[];
}

export interface Message {
  id: string;
  content: string;
  role: 'system' | 'user' | 'assistant';
  links?: string[];
}
