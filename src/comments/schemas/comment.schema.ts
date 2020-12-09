import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import {ApiProperty} from "@nestjs/swagger";


@Schema({ versionKey: false })
export class Comment extends Document {
    @Prop({ required: true })
    @ApiProperty({ description: 'The content of the comment' })
    text: string;

    @Prop({ required: true, default: Date.now() })
    @ApiProperty({ description: 'Date the comment was added' })
    date: Date;

    @Prop({ required: true })
    @ApiProperty({ description: 'ObjectId of commented video' })
    video: Types.ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
