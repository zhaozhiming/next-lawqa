import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';

let checkChain: LLMChain | undefined;

export const checkLlmChain = (): LLMChain => {
  if (!checkChain) {
    const checkModel = new ChatOpenAI({
      openAIApiKey: process.env.CHATGPT_APIKEY,
      temperature: 0,
      maxTokens: 1,
    });
    const checkPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(`
    Your are a helpful assistant for the expert in Chinese law. 
    Please help me to judge whether the user question is related to the law. 
    If yes, please answer 'Y', if not, please answer 'N'. 
    Just reply one character, do not output additional information.`),
      HumanMessagePromptTemplate.fromTemplate('{question}'),
    ]);
    checkChain = new LLMChain({ llm: checkModel, prompt: checkPrompt });
  }
  return checkChain;
};
