import { Module } from '@nestjs/common';
import { CareersModule } from '../careers/careers.module';
import { LeadsModule } from '../leads/leads.module';
import { MediaModule } from '../media/media.module';
import { SeoModule } from '../seo/seo.module';
import { SettingsModule } from '../settings/settings.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [SettingsModule, SeoModule, LeadsModule, MediaModule, CareersModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
