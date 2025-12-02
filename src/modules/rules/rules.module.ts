import { Module } from '@nestjs/common';
import { RulesController } from '../../controllers/rules.controller';
import { RulesService } from '../../services/rules.service';

@Module({
    controllers: [RulesController],
    providers: [RulesService],
    exports: [RulesService],
})
export class RulesModule { }
