import { LangChainStream, Message, StreamingTextResponse } from 'ai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
  AIChatMessage,
  BaseChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from 'langchain/schema';
import { Link } from '@/app/data-structure';

export async function POST(req: Request) {
  const { messages, links = [] }: { messages: Message[]; links: Link[] } =
    await req.json();
  const userSubmitPrompt = messages[messages.length - 1];
  const { stream, handlers } = LangChainStream();
  const llm = new ChatOpenAI({
    openAIApiKey: process.env.CHATGPT_APIKEY,
    temperature: 0.9,
    maxTokens: 500,
    streaming: true,
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
        return `${x.file}: ${x.content}`;
      })
      .join('\n' + '-'.repeat(20) + '\n')}####
    `)
  );

  llm.call(chatMessages, {}, [handlers]).catch(console.error);
  return new StreamingTextResponse(stream);
}
