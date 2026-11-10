import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeliveriesService } from './deliveries.service.js';
import { CsvImportService } from './csv-import.service.js';
import { CreateDeliveryDto } from './dto/create-delivery.dto.js';
import { UpdateDeliveryDto } from './dto/update-delivery.dto.js';
import { FilterDeliveriesDto } from './dto/filter-deliveries.dto.js';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto.js';
import { ChangeDeliveryStatusDto } from './dto/change-delivery-status.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveriesController {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly csvImportService: CsvImportService,
  ) {}

  @Post()
  create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDeliveryDto,
  ) {
    return this.deliveriesService.create(companyId, userId, dto);
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  uploadCsv(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Debe subir un archivo CSV en el campo "file"');
    }
    return this.csvImportService.processCsv(
      companyId,
      userId,
      file.buffer,
      file.originalname,
    );
  }

  @Get()
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() filterDto: FilterDeliveriesDto,
  ) {
    return this.deliveriesService.findAll(companyId, filterDto);
  }

  @Get(':id')
  findOne(
    @CurrentUser('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliveriesService.findOne(companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryDto,
  ) {
    return this.deliveriesService.update(companyId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeDeliveryStatusDto,
  ) {
    return this.deliveriesService.changeStatus(companyId, userId, id, dto);
  }

  @Get(':id/events')
  getTimeline(
    @CurrentUser('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliveriesService.getDeliveryTimeline(companyId, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliveriesService.remove(companyId, id);
  }
}
