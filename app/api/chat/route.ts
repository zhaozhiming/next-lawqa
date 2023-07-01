import path from 'path';
import fs from 'fs';
import { Message } from 'ai';
import { NextResponse } from 'next/server';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
  AIChatMessage,
  BaseChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from 'langchain/schema';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { VECTOR_STORE_DIRECTORY } from '@/app/constants';
import { download } from '../utils/fileUtils';
import { checkLlmChain } from '../utils/llm';

const dowloadVectoreStore = async (directory: string) => {
  const argsJson = path.join(directory, 'args.json');
  const docstoreJson = path.join(directory, 'docstore.json');
  const hnswlibIndex = path.join(directory, 'hnswlib.index');
  if (
    fs.existsSync(directory) &&
    fs.existsSync(argsJson) &&
    fs.existsSync(docstoreJson) &&
    fs.existsSync(hnswlibIndex)
  )
    return;

  fs.mkdirSync(directory);
  const baseUrl =
    'https://raw.githubusercontent.com/zhaozhiming/next-lawqa/main/vector-store';
  await Promise.all([
    download(`${baseUrl}/args.json`, argsJson),
    download(`${baseUrl}/docstore.json`, docstoreJson),
    download(`${baseUrl}/hnswlib.index`, hnswlibIndex),
  ]);
};

const checkPrompt = async (prompt: string): Promise<boolean> => {
  const checkChain = checkLlmChain();
  const res = await checkChain.call({ question: prompt });
  return res.text.includes('Y');
};

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userSubmitPrompt = messages[messages.length - 1];
  const isLawQuestion = await checkPrompt(userSubmitPrompt.content);
  if (!isLawQuestion) {
    return NextResponse.json({
      answer:
        '很抱歉，作为法律专家，我可能无法就与法律无关的话题展开深入的交谈。',
    });
  }

  const directory = path.join('/tmp', VECTOR_STORE_DIRECTORY);
  await dowloadVectoreStore(directory);
  const vectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings());
  const links = await vectorStore.similaritySearch(userSubmitPrompt.content, 2);

  const llm = new ChatOpenAI({
    openAIApiKey: process.env.CHATGPT_APIKEY,
    temperature: 0.9,
    maxTokens: 500,
    timeout: 10000,
  });

  const chatMessages: BaseChatMessage[] = [
    new SystemChatMessage(`
      You are a valuable assistant to the Chinese law expert. 
      Please provide answers to questions based on the information enclosed within four pound signs (####).
      Always respond in Chinese.
      If a user's question is unrelated to the law, kindly decline to answer it.`),
  ];
  chatMessages.push(
    ...messages.slice(0, messages.length - 1).map((m: Message) => {
      return m.role == 'user'
        ? new HumanChatMessage(m.content)
        : new AIChatMessage(m.content);
    })
  );
  chatMessages.push(
    new HumanChatMessage(`
    user question: ${userSubmitPrompt.content}

    ####information: ${links
      .map((x) => {
        const lawName = path.basename(
          x.metadata.source,
          path.extname(x.metadata.source)
        );
        return `${lawName}: ${x.pageContent}`;
      })
      .join('\n' + '-'.repeat(20) + '\n')}####
    `)
  );

  const ressult = await llm.call(chatMessages);
  return NextResponse.json({
    answer: ressult.text,
    links: links.map((link) => {
      const lawName = path.basename(
        link.metadata.source,
        path.extname(link.metadata.source)
      );
      return `${link.pageContent} —— ${lawName}`;
    }),
  });
}
