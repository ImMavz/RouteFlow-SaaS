import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { DashboardQueryDto, WeeklyVolumeQueryDto } from './dto/dashboard-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(
    @CurrentUser('companyId') companyId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.analyticsService.getSummary(companyId, query.date);
  }

  @Get('weekly-volume')
  getWeeklyVolume(
    @CurrentUser('companyId') companyId: string,
    @Query() query: WeeklyVolumeQueryDto,
  ) {
    return this.analyticsService.getWeeklyVolume(companyId, query.endDate);
  }

  @Get('routes')
  getActiveRoutes(
    @CurrentUser('companyId') companyId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.analyticsService.getActiveRoutesOverview(companyId, query.date);
  }
}
