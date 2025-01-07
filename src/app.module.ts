import { Module } from '@nestjs/common';
import { OpenAIModule } from './openai/openai.module';
import { VoiceModule } from './voice/voice.module';


@Module({
  imports: [OpenAIModule, VoiceModule],
})
export class AppModule {}
