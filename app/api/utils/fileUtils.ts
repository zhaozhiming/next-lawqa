import fs from 'fs';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { pipeline } from 'stream';
import { promisify } from 'util';

export const executeCommand = (command: string) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
};

export const download = async (url: string, path: string): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Unexpected response ${response.statusText}`);

  await promisify(pipeline)(response.body || '', fs.createWriteStream(path));
};