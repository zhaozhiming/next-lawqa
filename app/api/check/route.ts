import { NextResponse } from 'next/server';
import { checkLlmChain } from '../utils/llm';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const checkChain = checkLlmChain();
  const res = await checkChain.call({ question: prompt });
  return NextResponse.json({ isLawQuestion: res.text.includes('Y') });
}
