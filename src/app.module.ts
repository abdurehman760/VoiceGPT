import { Module } from '@nestjs/common';
import { OpenAIModule } from './openai/openai.module';
import { VoiceModule } from './voice/voice.module';
import { PineconeModule } from './pinecone/pinecone.module';
import { TrainModule } from './train/train.module';

@Module({
  imports: [OpenAIModule, VoiceModule, PineconeModule, TrainModule],
})
export class AppModule {}
