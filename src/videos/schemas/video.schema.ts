import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ApiProperty} from "@nestjs/swagger";
import {Document} from "mongoose";


@Schema({ versionKey: false })
export class Video extends Document {
    @Prop({ required: true })
    @ApiProperty({ description: 'Video title' })
    title: string;

    @Prop()
    @ApiProperty({ description: 'Video description' })
    desc: string;

    @Prop()
    @ApiProperty({ description: 'Video tags' })
    tags: Array<string>;

    @Prop({ required: true })
    @ApiProperty({ description: 'Video file path' })
    path: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Video preview file path' })
    thumb: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Video cover file path' })
    cover: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Video number of visits' })
    visits: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Video publication status' })
    stat: number;
}


export const VideoSchema = SchemaFactory.createForClass(Video);
