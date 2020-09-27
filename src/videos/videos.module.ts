import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Video, VideoSchema } from './schemas/video.schema';
import {User, UserSchema} from "../users/schemas/user.schema";
import {AuthService} from "../auth/auth.service";
import {UserService} from "../users/users.service";

@Module({
    imports: [MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }, { name: User.name, schema: UserSchema }])],
    controllers: [VideosController],
    providers: [VideosService, AuthService, UserService]
})
export class VideosModule {}
