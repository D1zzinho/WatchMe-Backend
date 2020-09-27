import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {Video} from "../../videos/schemas/video.schema";


@Schema({ versionKey: false })
export class User extends Document {
    @Prop({ required: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    email: string;

    @Prop()
    firstname: string;

    @Prop()
    lastname: string;

    @Prop()
    about: string;

    @Prop()
    videos: Array<Video>;

    @Prop()
    comments: Array<any>;

    @Prop({ default: 1 })
    permissions: number;

    @Prop({ default: Date.now() })
    lastLoginDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
