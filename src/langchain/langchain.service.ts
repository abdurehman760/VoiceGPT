import { Injectable } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as textract from 'textract';
import { OpenAI } from 'openai';

@Injectable()
export class LangchainService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbeddings(file: Express.Multer.File) {
    let textContent: string;

    if (file.mimetype === 'application/pdf') {
      textContent = await this.parsePdf(file.buffer);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      textContent = await this.parseDocx(file.buffer);
    } else {
      throw new Error('Unsupported file type');
    }

    // Generate embeddings using OpenAI
    const embeddings = await this.createEmbeddingsFromText(textContent);

    return embeddings;
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      textract.fromBufferWithMime('application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer, (error, text) => {
        if (error) {
          return reject(error);
        }
        resolve(text);
      });
    });
  }

  private async createEmbeddingsFromText(text: string) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    const embeddings = response.data.map((embedding, index) => ({
      id: `doc-${index}`,
      values: embedding.embedding,
      metadata: { text },
    }));

    return embeddings;
  }
}
