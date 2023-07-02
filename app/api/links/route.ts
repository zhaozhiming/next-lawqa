import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { VECTOR_STORE_DIRECTORY } from '@/app/constants';
import { Link } from '@/app/data-structure';
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
    download(`${baseUrl}/docstore.json`, docstoreJson),
    download(`${baseUrl}/hnswlib.index`, hnswlibIndex),
  ]);
};

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const directory = path.join('/tmp', VECTOR_STORE_DIRECTORY);
  await dowloadVectoreStore(directory);
  const vectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings());
  const queryResult = await vectorStore.similaritySearch(prompt, 2);
  const links: Link[] = queryResult.map((x) => {
    const file = path.basename(
      x.metadata.source,
      path.extname(x.metadata.source)
    );
    return {
      file,
      content: x.pageContent,
    };
  });
  return NextResponse.json({
    links,
  });
}
