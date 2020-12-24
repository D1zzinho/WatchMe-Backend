import {HttpModule, Module} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

import {User, UserSchema} from './schemas/user.schema'
import { HttpExceptionFilter } from '../shared/http-exception.filter';
import { UserService } from './users.service'
import {UsersController} from "./users.controller";
import {GitHubUser, GitHubUserSchema} from "./schemas/gitHubUser.schema";

@Module({
  imports: [HttpModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: GitHubUser.name, schema: GitHubUserSchema}])],
  providers: [
    UserService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    }
  ],
  controllers: [UsersController],
  exports: [UserService],
})
export class UsersModule {}
