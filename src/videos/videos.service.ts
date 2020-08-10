import {Connection, Model} from 'mongoose';
import { Injectable } from '@nestjs/common';
import {InjectConnection, InjectModel} from '@nestjs/mongoose';
import { Video } from "./schemas/video.schema";

@Injectable()
export class VideosService {
    constructor(@InjectModel(Video.name) private readonly videoModel: Model<Video>) {}

    async findAll(): Promise<Video[]> {
        return this.videoModel.find().sort({ _id: -1 });
    }

    async findVideo(id: string): Promise<Video> {
        return this.videoModel.findById(id);
    }

    async searchVideosByQuery(query: string): Promise<Video[]> {
        const matchingQuery = new Array<Object>();
        matchingQuery.push({
            '$match': {
                '$or': [
                    {
                        'title': new RegExp(query, 'i')
                    },
                    {
                        'desc': new RegExp(query, 'i')
                    },
                    {
                        'tags': new RegExp(query, 'i')
                    }
                ]
            }
        });

        const videos = this.videoModel.aggregate(matchingQuery);

        return videos;
    }
}
