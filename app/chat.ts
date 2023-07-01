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

export const checkPrompt = async (prompt: string): Promise<CheckResult> => {
  const response = await fetch('/api/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  }
  throw new Error();
};

export const submitQuestion = async (
  messages: Message[]
): Promise<QaResult> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
    }),
  });
  if (response.ok) {
    const result = await response.json();
    return result;
  }

  throw new Error();
};
