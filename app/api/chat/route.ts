import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { pipeline } from 'stream';
import { promisify } from 'util';
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

const executeCommand = (command: string) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
};

const download = async (url: string, path: string): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Unexpected response ${response.statusText}`);

  await promisify(pipeline)(response.body || '', fs.createWriteStream(path));
};

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userSubmitPrompt = messages[messages.length - 1];

  // add production log
  executeCommand('pwd');
  const directory = path.join(process.cwd(), VECTOR_STORE_DIRECTORY);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
  const argsJson = path.join(directory, 'args.json');
  if (!fs.existsSync(argsJson)) {
    await download(
      'https://raw.githubusercontent.com/zhaozhiming/next-lawqa/main/vector-store/args.json',
      argsJson
    );
  }
  const docstoreJson = path.join(directory, 'docstore.json');
  if (!fs.existsSync(docstoreJson)) {
    await download(
      'https://raw.githubusercontent.com/zhaozhiming/next-lawqa/main/vector-store/docstore.json',
      docstoreJson
    );
  }
  const hnswlibIndex = path.join(directory, 'hnswlib.index');
  if (!fs.existsSync(hnswlibIndex)) {
    await download(
      'https://raw.githubusercontent.com/zhaozhiming/next-lawqa/main/vector-store/hnswlib.index',
      hnswlibIndex
    );
  }
  executeCommand('ls -l');

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
