import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {Video} from "../../videos/schemas/video.schema";
import {ApiProperty} from "@nestjs/swagger";


@Schema({ versionKey: false })
export class User extends Document {
    @Prop({ required: true })
    @ApiProperty({ description: 'Username' })
    username: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Password' })
    password: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'E-mail address' })
    email: string;

    @Prop()
    @ApiProperty({ description: 'User firstname' })
    firstname: string;

    @Prop()
    @ApiProperty({ description: 'User lastname' })
    lastname: string;

    @Prop()
    @ApiProperty({ description: 'User about' })
    about: string;

    @Prop()
    @ApiProperty({ description: 'Videos added by user' })
    videos: Array<Video>;

    @Prop()
    @ApiProperty({ description: 'User comments' })
    comments: Array<Comment>;

    @Prop({ default: 1 })
    @ApiProperty({ description: 'User permissions' })
    permissions: number;

    @Prop({ default: Date.now() })
    @ApiProperty({ description: 'User last login date' })
    lastLoginDate: Date;

    @Prop({ default: '' })
    @ApiProperty({ description: 'User avatar' })
    avatar: string;

    @Prop({ default: Date.now() })
    @ApiProperty({ description: 'User register date' })
    registerDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
