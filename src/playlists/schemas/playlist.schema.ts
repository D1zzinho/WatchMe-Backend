import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document} from "mongoose";
import {ApiProperty} from "@nestjs/swagger";

@Schema({ versionKey: false })
export class Playlist extends Document {
    @Prop({ required: true })
    @ApiProperty({ description: 'Playlist name' })
    name: string;

    @Prop({ default: true })
    @ApiProperty({ description: 'Playlist publication state' })
    isPrivate: boolean;

    @Prop({ default: new Array<any>() })
    @ApiProperty({ description: 'Playlist array of videos' })
    videos: Array<any>;
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);
