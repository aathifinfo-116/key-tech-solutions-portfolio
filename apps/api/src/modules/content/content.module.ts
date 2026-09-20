import { Module } from '@nestjs/common';
import { AuthorAdminService, BlogCategoryAdminService, BlogPostAdminService } from './blog.service';
import {
  CompanyValueAdminService,
  MilestoneAdminService,
  ProcessPhaseAdminService,
  StatisticAdminService,
  TeamMemberAdminService,
  TechnologyAdminService,
  TechnologyCategoryAdminService,
} from './company.service';
import {
  IndustryAdminService,
  ProductAdminService,
  ServiceAdminService,
  SolutionAdminService,
} from './offerings.service';
import { PageAdminService } from './pages.service';
import {
  CaseStudyAdminService,
  ClientAdminService,
  PartnerAdminService,
  PortfolioAdminService,
  TestimonialAdminService,
} from './portfolio.service';

const SERVICES = [
  PageAdminService,
  ServiceAdminService,
  SolutionAdminService,
  IndustryAdminService,
  ProductAdminService,
  PortfolioAdminService,
  CaseStudyAdminService,
  TestimonialAdminService,
  ClientAdminService,
  PartnerAdminService,
  BlogPostAdminService,
  BlogCategoryAdminService,
  AuthorAdminService,
  ProcessPhaseAdminService,
  CompanyValueAdminService,
  MilestoneAdminService,
  StatisticAdminService,
  TechnologyAdminService,
  TechnologyCategoryAdminService,
  TeamMemberAdminService,
];

@Module({ providers: SERVICES, exports: SERVICES })
export class ContentModule {}
