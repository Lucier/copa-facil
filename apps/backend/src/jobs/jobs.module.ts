import { Global, Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigService } from '@nestjs/config'
import { QUEUE_NAMES } from './queues/queue-names.const'

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('redis.url') },
      }),
    }),
    ...Object.values(QUEUE_NAMES).map((name) =>
      BullModule.registerQueue({ name }),
    ),
  ],
  exports: [BullModule],
})
export class JobsModule {}
