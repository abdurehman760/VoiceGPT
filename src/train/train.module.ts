import { Module } from '@nestjs/common';
import { TrainController } from './train.controller';
import { PineconeModule } from '../pinecone/pinecone.module';
import { LangchainModule } from '../langchain/langchain.module';

@Module({
  imports: [PineconeModule, LangchainModule],
  controllers: [TrainController],
})
export class TrainModule {}
