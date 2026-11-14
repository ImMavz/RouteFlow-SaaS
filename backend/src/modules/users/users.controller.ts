import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateDriverDto } from './dto/create-driver.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('drivers')
  createDriver(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateDriverDto,
  ) {
    return this.usersService.createDriver(companyId, dto);
  }

  @Get('drivers')
  findDrivers(@CurrentUser('companyId') companyId: string) {
    return this.usersService.findDrivers(companyId);
  }

  @Delete('drivers/:id')
  removeDriver(
    @CurrentUser('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.removeDriver(companyId, id);
  }
}
