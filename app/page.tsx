'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AiOutlineLoading3Quarters,
  AiOutlineRobot,
  AiOutlineUser,
} from 'react-icons/ai';
import { toast } from 'react-toastify';
import { Slide, ToastContainer } from 'react-toastify';
import { Message, QaResult, checkPrompt, submitQuestion } from './chat';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<QaResult>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (result) {
      setMessages([
        ...messages,
        {
          id: uuidv4(),
          role: 'assistant',
          content: result.answer,
          links: result.links,
        },
      ]);
    }
  }, [result]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const newMessages = [
      ...messages,
      { id: uuidv4(), role: 'user', content: input } as Message,
    ];
    setMessages(newMessages);
    setInput('');

    try {
      const { isLawQuestion } = await checkPrompt(input);
      if (!isLawQuestion) {
        setMessages([
          ...newMessages,
          {
            id: uuidv4(),
            role: 'assistant',
            content:
              '很抱歉，作为法律专家，我可能无法就与法律无关的话题展开深入的交谈。',
          },
        ]);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      setMessages(newMessages.slice(0, -1));
      toast.error('问错错误，请稍后重试');
      setIsLoading(false);
      return;
    }

    try {
      const res = await submitQuestion(newMessages);
      setResult({
        answer: res.answer,
        links: res.links,
      });
    } catch (e) {
      setMessages(newMessages.slice(0, -1));
      toast.error('问错错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    return (
      <div className="flex flex-col py-8 divide-y" key={message.id}>
        <div className={`flex flex-row ${message.links && 'mb-6'}`}>
          <div className="mr-2 mt-0.5 ">
            {message.role === 'user' ? (
              <AiOutlineUser className="h-6 w-6" />
            ) : (
              <AiOutlineRobot className="h-6 w-6 text-lime-500" />
            )}
          </div>
          <span>{message.content}</span>
        </div>
        {message.links && (
          <div className="pt-6">
            <h3 className="text-sm">参考资料</h3>
            <ol className="mt-2 flex flex-col gap-y-2 text-xs pl-4 list-disc">
              {message.links?.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setResult(undefined);
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
        {messages.length > 0 ? messages.map((m) => renderMessage(m)) : null}
        {isLoading && (
          <AiOutlineLoading3Quarters className="icon-spin h-6 w-6" />
        )}
      </div>

      <form onSubmit={handleSubmit}>
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
