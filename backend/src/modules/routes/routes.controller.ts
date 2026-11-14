import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RoutesService } from './routes.service.js';
import { FilterRoutesDto } from './dto/filter-routes.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RouteStatus } from '../../common/enums/route-status.enum.js';

@Controller('routes')
@UseGuards(JwtAuthGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('driver/active')
  findActiveDriverRoute(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') driverId: string,
  ) {
    return this.routesService.findActiveDriverRoute(companyId, driverId);
  }

  @Get()
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() filterDto: FilterRoutesDto,
  ) {
    return this.routesService.findAll(companyId, filterDto);
  }

  @Get(':id')
  findOne(
    @CurrentUser('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routesService.findOne(companyId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: RouteStatus,
  ) {
    return this.routesService.updateStatus(companyId, id, status);
  }

  @Delete(':id')
  remove(
    @CurrentUser('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routesService.remove(companyId, id);
  }
}

