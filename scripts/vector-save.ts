import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { VECTOR_STORE_DIRECTORY } from '@/app/constants';

const embeddings = new OpenAIEmbeddings();
const splitter = new CharacterTextSplitter({
  chunkSize: 100,
  chunkOverlap: 5,
});

const main = async () => {
  console.log('加载文档...');
  const loader = new DirectoryLoader('source-docs', {
    '.txt': (path) => new TextLoader(path),
  });
  const sourceDocs = await loader.load();
  console.log(`原始文档个数：${sourceDocs.length}`);

  const docs = await splitter.splitDocuments(sourceDocs);
  console.log(`分割文档个数：${docs.length}`);

  const vectorStore = await HNSWLib.fromDocuments(docs, embeddings);
  const directory = VECTOR_STORE_DIRECTORY;
  await vectorStore.save(directory);
  console.log('加载完成');
};

main();
