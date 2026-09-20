/**
 * Admin content controllers.
 *
 * Each one is a thin binding of a route prefix to a service and its two input
 * schemas; the shared route surface (list, read, create, update, status,
 * duplicate, reorder, revisions, archive) comes from BaseCrudController, and
 * permission checks are enforced inside the services.
 */

import { Controller } from '@nestjs/common';
import {
  authorSchema,
  blogCategorySchema,
  blogPostSchema,
  caseStudySchema,
  clientSchema,
  companyMilestoneSchema,
  companyValueSchema,
  industrySchema,
  pageSchema,
  portfolioProjectSchema,
  processPhaseSchema,
  productSchema,
  serviceSchema,
  solutionSchema,
  statisticSchema,
  teamMemberSchema,
  technologyCategorySchema,
  technologySchema,
  testimonialSchema,
} from '@kts/validation';
import { BaseCrudController } from '../../common/crud/crud.controller';
import {
  AuthorAdminService,
  BlogCategoryAdminService,
  BlogPostAdminService,
} from '../content/blog.service';
import {
  CompanyValueAdminService,
  MilestoneAdminService,
  ProcessPhaseAdminService,
  StatisticAdminService,
  TeamMemberAdminService,
  TechnologyAdminService,
  TechnologyCategoryAdminService,
} from '../content/company.service';
import {
  IndustryAdminService,
  ProductAdminService,
  ServiceAdminService,
  SolutionAdminService,
} from '../content/offerings.service';
import { PageAdminService } from '../content/pages.service';
import {
  CaseStudyAdminService,
  ClientAdminService,
  PartnerAdminService,
  PortfolioAdminService,
  TestimonialAdminService,
} from '../content/portfolio.service';

@Controller('api/v1/admin/pages')
export class AdminPagesController extends BaseCrudController<unknown> {
  protected readonly createSchema = pageSchema;
  protected readonly updateSchema = pageSchema;
  constructor(protected readonly service: PageAdminService) {
    super();
  }
}

@Controller('api/v1/admin/services')
export class AdminServicesController extends BaseCrudController<unknown> {
  protected readonly createSchema = serviceSchema;
  protected readonly updateSchema = serviceSchema;
  constructor(protected readonly service: ServiceAdminService) {
    super();
  }
}

@Controller('api/v1/admin/solutions')
export class AdminSolutionsController extends BaseCrudController<unknown> {
  protected readonly createSchema = solutionSchema;
  protected readonly updateSchema = solutionSchema;
  constructor(protected readonly service: SolutionAdminService) {
    super();
  }
}

@Controller('api/v1/admin/industries')
export class AdminIndustriesController extends BaseCrudController<unknown> {
  protected readonly createSchema = industrySchema;
  protected readonly updateSchema = industrySchema;
  constructor(protected readonly service: IndustryAdminService) {
    super();
  }
}

@Controller('api/v1/admin/products')
export class AdminProductsController extends BaseCrudController<unknown> {
  protected readonly createSchema = productSchema;
  protected readonly updateSchema = productSchema;
  constructor(protected readonly service: ProductAdminService) {
    super();
  }
}

@Controller('api/v1/admin/portfolio')
export class AdminPortfolioController extends BaseCrudController<unknown> {
  protected readonly createSchema = portfolioProjectSchema;
  protected readonly updateSchema = portfolioProjectSchema;
  constructor(protected readonly service: PortfolioAdminService) {
    super();
  }
}

@Controller('api/v1/admin/case-studies')
export class AdminCaseStudiesController extends BaseCrudController<unknown> {
  protected readonly createSchema = caseStudySchema;
  protected readonly updateSchema = caseStudySchema;
  constructor(protected readonly service: CaseStudyAdminService) {
    super();
  }
}

@Controller('api/v1/admin/testimonials')
export class AdminTestimonialsController extends BaseCrudController<unknown> {
  protected readonly createSchema = testimonialSchema;
  protected readonly updateSchema = testimonialSchema;
  constructor(protected readonly service: TestimonialAdminService) {
    super();
  }
}

@Controller('api/v1/admin/clients')
export class AdminClientsController extends BaseCrudController<unknown> {
  protected readonly createSchema = clientSchema;
  protected readonly updateSchema = clientSchema;
  constructor(protected readonly service: ClientAdminService) {
    super();
  }
}

@Controller('api/v1/admin/partners')
export class AdminPartnersController extends BaseCrudController<unknown> {
  protected readonly createSchema = clientSchema;
  protected readonly updateSchema = clientSchema;
  constructor(protected readonly service: PartnerAdminService) {
    super();
  }
}

@Controller('api/v1/admin/blog')
export class AdminBlogController extends BaseCrudController<unknown> {
  protected readonly createSchema = blogPostSchema;
  protected readonly updateSchema = blogPostSchema;
  constructor(protected readonly service: BlogPostAdminService) {
    super();
  }
}

@Controller('api/v1/admin/blog-categories')
export class AdminBlogCategoriesController extends BaseCrudController<unknown> {
  protected readonly createSchema = blogCategorySchema;
  protected readonly updateSchema = blogCategorySchema;
  constructor(protected readonly service: BlogCategoryAdminService) {
    super();
  }
}

@Controller('api/v1/admin/authors')
export class AdminAuthorsController extends BaseCrudController<unknown> {
  protected readonly createSchema = authorSchema;
  protected readonly updateSchema = authorSchema;
  constructor(protected readonly service: AuthorAdminService) {
    super();
  }
}

@Controller('api/v1/admin/process-phases')
export class AdminProcessController extends BaseCrudController<unknown> {
  protected readonly createSchema = processPhaseSchema;
  protected readonly updateSchema = processPhaseSchema;
  constructor(protected readonly service: ProcessPhaseAdminService) {
    super();
  }
}

@Controller('api/v1/admin/company-values')
export class AdminValuesController extends BaseCrudController<unknown> {
  protected readonly createSchema = companyValueSchema;
  protected readonly updateSchema = companyValueSchema;
  constructor(protected readonly service: CompanyValueAdminService) {
    super();
  }
}

@Controller('api/v1/admin/milestones')
export class AdminMilestonesController extends BaseCrudController<unknown> {
  protected readonly createSchema = companyMilestoneSchema;
  protected readonly updateSchema = companyMilestoneSchema;
  constructor(protected readonly service: MilestoneAdminService) {
    super();
  }
}

@Controller('api/v1/admin/statistics')
export class AdminStatisticsController extends BaseCrudController<unknown> {
  protected readonly createSchema = statisticSchema;
  protected readonly updateSchema = statisticSchema;
  constructor(protected readonly service: StatisticAdminService) {
    super();
  }
}

@Controller('api/v1/admin/technologies')
export class AdminTechnologiesController extends BaseCrudController<unknown> {
  protected readonly createSchema = technologySchema;
  protected readonly updateSchema = technologySchema;
  constructor(protected readonly service: TechnologyAdminService) {
    super();
  }
}

@Controller('api/v1/admin/technology-categories')
export class AdminTechnologyCategoriesController extends BaseCrudController<unknown> {
  protected readonly createSchema = technologyCategorySchema;
  protected readonly updateSchema = technologyCategorySchema;
  constructor(protected readonly service: TechnologyCategoryAdminService) {
    super();
  }
}

@Controller('api/v1/admin/team')
export class AdminTeamController extends BaseCrudController<unknown> {
  protected readonly createSchema = teamMemberSchema;
  protected readonly updateSchema = teamMemberSchema;
  constructor(protected readonly service: TeamMemberAdminService) {
    super();
  }
}

export const ADMIN_CONTENT_CONTROLLERS = [
  AdminPagesController,
  AdminServicesController,
  AdminSolutionsController,
  AdminIndustriesController,
  AdminProductsController,
  AdminPortfolioController,
  AdminCaseStudiesController,
  AdminTestimonialsController,
  AdminClientsController,
  AdminPartnersController,
  AdminBlogController,
  AdminBlogCategoriesController,
  AdminAuthorsController,
  AdminProcessController,
  AdminValuesController,
  AdminMilestonesController,
  AdminStatisticsController,
  AdminTechnologiesController,
  AdminTechnologyCategoriesController,
  AdminTeamController,
];
