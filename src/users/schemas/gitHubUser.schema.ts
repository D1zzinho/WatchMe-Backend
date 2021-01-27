import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {Video} from "../../videos/schemas/video.schema";
import {ApiProperty} from "@nestjs/swagger";
import {Playlist} from "../../playlists/schemas/playlist.schema";


@Schema({ versionKey: false })
export class GitHubUser extends Document {
    @Prop({ required: true })
    @ApiProperty({ description: 'Username' })
    username: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'GitHub user profile url' })
    url: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'GitHub user avatar' })
    avatar: string;

    @Prop()
    @ApiProperty({ description: 'GitHub user email' })
    email: string;

    @Prop()
    @ApiProperty({ description: 'GitHub user name' })
    name: string;

    @Prop()
    @ApiProperty({ description: 'GitHub user bio' })
    about: string;

    @Prop()
    @ApiProperty({ description: 'Videos added by GitHub user' })
    videos: Array<Video>;

    @Prop()
    @ApiProperty({ description: 'User playlists' })
    playlists: Array<Playlist>;

    @Prop()
    @ApiProperty({ description: 'GitHub user comments' })
    comments: Array<Comment>;

    @Prop({ default: 1 })
    @ApiProperty({ description: 'GitHub user permissions' })
    permissions: number;

    @Prop({ default: Date.now() })
    @ApiProperty({ description: 'GitHub user last login date' })
    lastLoginDate: Date;
}

export const GitHubUserSchema = SchemaFactory.createForClass(GitHubUser);
