import path from 'path';
import fs from 'fs';
import { StreamingTextResponse, LangChainStream, Message } from 'ai';
import { CallbackManager } from 'langchain/callbacks';
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
    download(`${baseUrl}/args.json`, docstoreJson),
    download(`${baseUrl}/args.json`, hnswlibIndex),
  ]);
};

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userSubmitPrompt = messages[messages.length - 1];

  // const directory = path.join(process.cwd(), VECTOR_STORE_DIRECTORY);
  const directory = path.join(process.cwd(), 'foo');
  await dowloadVectoreStore(directory);
  const vectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings());
  const similarDocs = await vectorStore.similaritySearch(
    userSubmitPrompt.content,
    2
  );

  const { stream, handlers } = LangChainStream();
  const llm = new ChatOpenAI({
    streaming: true,
    callbackManager: CallbackManager.fromHandlers(handlers),
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
    ####information: ${similarDocs
      .map((x) => x.pageContent)
      .join('\n' + '-'.repeat(20) + '\n')}####
    user question: ${userSubmitPrompt.content}
    `)
  );

  llm.call(chatMessages).catch(console.error);

  return new StreamingTextResponse(stream);
}
