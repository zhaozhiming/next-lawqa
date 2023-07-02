import { CheckResult, Link, Links, Message, QaResult } from './data-structure';

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

export const queryLinks = async (prompt: string): Promise<Links> => {
  const response = await fetch('/api/links', {
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
  messages: Message[],
  links: Link[]
): Promise<QaResult> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      links,
    }),
  });
  if (response.ok) {
    const result = await response.json();
    return result;
  }

  throw new Error();
};
