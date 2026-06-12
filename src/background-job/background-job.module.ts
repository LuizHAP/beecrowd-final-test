import { Module, OnModuleInit } from '@nestjs/common';
import { BackgroundJobService } from './background-job.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({})
export class BackgroundJobModule implements OnModuleInit {
  constructor(private jobService: BackgroundJobService) {}

  onModuleInit() {
    this.jobService.start();
  }
}
