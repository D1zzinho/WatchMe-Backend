import {HttpModule, Module} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpExceptionFilter } from '../shared/http-exception.filter';
import {CommentSchema} from "./schemas/comment.schema";
import {Comment} from "./schemas/comment.schema";
import {CommentsService} from "./comments.service";
import {CommentsController} from "./comments.controller";
import {Video, VideoSchema} from "../videos/schemas/video.schema";
import {User, UserSchema} from "../users/schemas/user.schema";
import {AuthService} from "../auth/auth.service";
import {UserService} from "../users/users.service";
import {VideosService} from "../videos/videos.service";
import {GitHubUser, GitHubUserSchema} from "../users/schemas/gitHubUser.schema";

@Module({
    imports: [
        HttpModule,
        MongooseModule.forFeature([
            { name: Comment.name, schema: CommentSchema },
            { name: Video.name, schema: VideoSchema },
            { name: User.name, schema: UserSchema },
            { name: GitHubUser.name, schema: GitHubUserSchema }
            ]
        )
    ],
    controllers: [CommentsController],
    providers: [
        CommentsService,
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        AuthService,
        UserService,
        VideosService
    ]
})
export class CommentsModule {}
