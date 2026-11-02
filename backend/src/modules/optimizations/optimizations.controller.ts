import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OptimizationsService } from './optimizations.service.js';
import { TriggerOptimizationDto } from './dto/trigger-optimization.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('optimizations')
@UseGuards(JwtAuthGuard)
export class OptimizationsController {
  constructor(private readonly optimizationsService: OptimizationsService) {}

  @Post('run')
  run(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: TriggerOptimizationDto,
  ) {
    return this.optimizationsService.runOptimization(companyId, userId, dto);
  }

  @Get('runs')
  findAllRuns(@CurrentUser('companyId') companyId: string) {
    return this.optimizationsService.findAllRuns(companyId);
  }

  @Get('runs/:id')
  findOneRun(
    @CurrentUser('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.optimizationsService.findOneRun(companyId, id);
  }
}

