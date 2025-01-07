// voice.module.ts
import { Module } from '@nestjs/common';
import { VoiceGateway } from './voice.gateway';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  providers: [VoiceGateway],
})
export class VoiceModule {}
