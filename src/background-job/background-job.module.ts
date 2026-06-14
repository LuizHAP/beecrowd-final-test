import { Module } from '@nestjs/common';
import { BackgroundJobService } from './background-job.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BackgroundJobService],
})
export class BackgroundJobModule {}
