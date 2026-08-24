import { Module } from '@nestjs/common';
import { HomeVehiclesController } from './home-vehicles.controller';
import { HomeVehiclesService } from './home-vehicles.service';

@Module({
  controllers: [HomeVehiclesController],
  providers: [HomeVehiclesService],
  exports: [HomeVehiclesService],
})
export class HomeVehiclesModule {}
