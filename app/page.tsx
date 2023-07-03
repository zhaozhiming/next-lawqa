'use client';

import { useId, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AiOutlineLoading3Quarters,
  AiOutlineRobot,
  AiOutlineUser,
} from 'react-icons/ai';
import { toast } from 'react-toastify';
import { Slide, ToastContainer } from 'react-toastify';
import { Message, UseChatOptions, useChat } from 'ai/react';
import 'react-toastify/dist/ReactToastify.css';
import { checkPrompt, queryLinks } from './chat';
import { Link } from './data-structure';

const useChatWrapper = (options?: UseChatOptions) => {
  const id = useId();
  const chat = useChat({ ...(options ?? {}), id });
  return chat;
};

export default function Home() {
  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
  } = useChatWrapper({});
  const [links, setLinks] = useState<Link[][]>([]);
  const [loading, setLoading] = useState(false);

  const handlePromptSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input || !input.trim()) return;

    setLoading(true);
    const prompt = input.trim();
    setInput('');
    try {
      const { isLawQuestion } = await checkPrompt(prompt);
      if (!isLawQuestion) {
        setMessages([
          ...messages,
          {
            id: uuidv4(),
            role: 'user',
            content: prompt,
          },
          {
            id: uuidv4(),
            role: 'assistant',
            content:
              '很抱歉，作为法律专家，我可能无法就与法律无关的话题展开深入的交谈。',
          },
        ]);
        setLinks([...links, []]);
        setLoading(false);
        return;
      }
    } catch (e) {
      setLoading(false);
      toast.error('问错错误，请稍后重试');
      return;
    }

    let promptLinks = [];
    try {
      const res = await queryLinks(prompt);
      promptLinks = res.links;
      setLinks([...links, promptLinks]);
    } catch (e) {
      toast.error('问错错误，请稍后重试');
      return;
    } finally {
      setLoading(false);
    }

    handleSubmit(e, { options: { body: { links: promptLinks } } });
  };

  const renderMessage = (message: Message, index: number) => {
    const answerLinks = message.role === 'assistant' && links[(index - 1) / 2];
    const hasLinks = answerLinks && answerLinks?.length > 0;
    return (
      <div className="flex flex-col py-8 divide-y" key={message.id}>
        <div className={`flex flex-row ${hasLinks && 'mb-6'}`}>
          <div className="mr-2 mt-0.5 ">
            {message.role === 'user' ? (
              <AiOutlineUser className="h-6 w-6" />
            ) : (
              <AiOutlineRobot className="h-6 w-6 text-lime-500" />
            )}
          </div>
          <span>{message.content}</span>
        </div>
        {hasLinks && (
          <div className="pt-6">
            <h3 className="text-sm">参考资料</h3>
            <ol className="mt-2 flex flex-col gap-y-2 text-xs pl-4 list-disc">
              {answerLinks.map((x: Link) => (
                <li key={uuidv4()}>
                  {x.content} —— {x.file}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setLinks([]);
  };

  return (
    <div className="mx-auto w-full max-w-xl pt-12 pb-20 flex flex-col stretch bg-zinc-50 min-h-screen">
      <div className="flex flex-row justify-between items-center px-8 pb-8 border-b">
        <header className="text-2xl font-bold">AI 劳动法问题咨询</header>
        <button
          className="btn-neutral w-16 h-8 rounded-md"
          onClick={handleReset}
        >
          重置
        </button>
      </div>
      <div className="flex flex-col divide-y px-8 ">
        {messages.length > 0
          ? messages.map((m, i) => renderMessage(m, i))
          : null}
        {loading && (
          <AiOutlineLoading3Quarters className="icon-spin h-6 w-6 mt-8" />
        )}
      </div>

      <form onSubmit={handlePromptSubmit}>
        <input
          className="fixed w-full max-w-xs mx-8 bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2 outline-none md:max-w-lg"
          value={input}
          placeholder="请输入您的问题..."
          onChange={handleInputChange}
        />
      </form>
      <ToastContainer
        hideProgressBar={true}
        position="top-center"
        transition={Slide}
      />
    </div>
  );
}
