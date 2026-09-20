import { Module } from '@nestjs/common';
import { CareerAdminService, JobApplicationService } from './careers.service';

@Module({
  providers: [CareerAdminService, JobApplicationService],
  exports: [CareerAdminService, JobApplicationService],
})
export class CareersModule {}
