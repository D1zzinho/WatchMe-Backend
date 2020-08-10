import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Video extends Document {
    @Prop({ required: true })
    title: string;

    @Prop()
    desc: number;

    @Prop()
    tags: string;

    @Prop({ required: true })
    path: string;

    @Prop({ required: true })
    thumb: string;

    @Prop({ required: true })
    cover: string;

    @Prop({ required: true })
    visits: number;

    @Prop({ required: true })
    stat: number;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
