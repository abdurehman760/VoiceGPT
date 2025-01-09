import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PineconeService } from '../pinecone/pinecone.service';
import { LangchainService } from '../langchain/langchain.service';

@Controller('train')
export class TrainController {
  constructor(
    private readonly pineconeService: PineconeService,
    private readonly langchainService: LangchainService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Parse the file and generate embeddings
    const embeddings = await this.langchainService.generateEmbeddings(file);

    // Format embeddings with metadata
    const formattedEmbeddings = embeddings.map((embedding, index) => ({
      id: `doc-${index}-${file.originalname}`,
      values: embedding.values,
      metadata: {
        title: file.originalname,
        uploadDate: new Date().toISOString(),
      },
    }));

    // Upsert embeddings into Pinecone
    const result = await this.pineconeService.upsertVectors(formattedEmbeddings);

    return result;
  }
}
