import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

import {User, UserSchema} from './schemas/user.schema'
import { HttpExceptionFilter } from './shared/http-exception.filter';
import { UserService } from './users.service'

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [
    UserService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    }
  ],
  exports: [UserService],
})
export class UsersModule {}
