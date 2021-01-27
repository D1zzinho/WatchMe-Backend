import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideosModule } from "./videos/videos.module";
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import {ConfigModule} from "@nestjs/config";
import {PassportModule} from "@nestjs/passport";
import { CommentsModule } from './comments/comments.module';
import { PlaylistsModule } from './playlists/playlists.module';

@Module({
    imports: [
        PassportModule.register({ session: true }),
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DB, {
            useNewUrlParser: true,
            useFindAndModify: false
        }),
        VideosModule,
        AuthModule,
        UsersModule,
        CommentsModule,
        PlaylistsModule
],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
