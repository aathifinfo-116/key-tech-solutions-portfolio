import { Module } from '@nestjs/common';
import { CareersModule } from '../careers/careers.module';
import { ContentModule } from '../content/content.module';
import { LeadsModule } from '../leads/leads.module';
import { MediaModule } from '../media/media.module';
import { SeoModule } from '../seo/seo.module';
import { SettingsModule } from '../settings/settings.module';
import { ADMIN_CONTENT_CONTROLLERS } from './admin-content.controllers';
import { ADMIN_OPERATION_CONTROLLERS } from './admin-operations.controllers';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ContentModule, CareersModule, LeadsModule, MediaModule, SeoModule, SettingsModule],
  controllers: [...ADMIN_CONTENT_CONTROLLERS, ...ADMIN_OPERATION_CONTROLLERS],
  providers: [DashboardService],
})
export class AdminModule {}
