import {HttpModule, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Video, VideoSchema } from './schemas/video.schema';
import {User, UserSchema} from "../users/schemas/user.schema";
import {AuthService} from "../auth/auth.service";
import {UserService} from "../users/users.service";
import {GitHubUser, GitHubUserSchema} from "../users/schemas/gitHubUser.schema";

@Module({
    imports: [
        HttpModule,
        MongooseModule.forFeature([
            { name: Video.name, schema: VideoSchema },
            { name: User.name, schema: UserSchema },
            { name: GitHubUser.name, schema: GitHubUserSchema }
            ]
        )
    ],
    controllers: [VideosController],
    providers: [VideosService, AuthService, UserService]
})
export class VideosModule {}
