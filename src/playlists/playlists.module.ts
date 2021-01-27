import {HttpModule, Module} from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import {MongooseModule} from "@nestjs/mongoose";
import {AuthService} from "../auth/auth.service";
import {UserService} from "../users/users.service";
import {Video, VideoSchema} from "../videos/schemas/video.schema";
import {User, UserSchema} from "../users/schemas/user.schema";
import {GitHubUser, GitHubUserSchema} from "../users/schemas/gitHubUser.schema";
import {Playlist, PlaylistSchema} from "./schemas/playlist.schema";
import {VideosService} from "../videos/videos.service";

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
        { name: Playlist.name, schema: PlaylistSchema },
        { name: Video.name, schema: VideoSchema },
        { name: User.name, schema: UserSchema },
        { name: GitHubUser.name, schema: GitHubUserSchema }
        ]
    )
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService, VideosService, AuthService, UserService]
})
export class PlaylistsModule {}
