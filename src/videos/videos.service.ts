import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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

        const videos = this.videoModel.aggregate(matchingQuery).sort({ _id: -1 });

        return videos;
    }


    async findSimilarVideos(tags: Array<string>): Promise<Video[]> {
        const matchingQuery = new Array<Object>();
        const insideQuery = new Array<Object>();

        tags.forEach(tag => {
            tag = tag.replace(/[{()}]/g, '').replace(/[\[\]']+/g, '');

            insideQuery.push({
                '$or': [
                    {
                        'title': new RegExp(tag, 'i')
                    },
                    {
                        'desc': new RegExp(tag, 'i')
                    },
                    {
                        'tags': new RegExp(tag, 'i')
                    }
                ]
            })
        })

        matchingQuery.push({
            '$match': {
                '$or': insideQuery
            }
        })

        const videos = this.videoModel.aggregate(matchingQuery).sort({ _id: -1 });

        return videos;
    }


    async addVideo(video: Video): Promise<Object> {
        try {
            const addVideo = await this.videoModel.create(video);
            await addVideo.save();

            return {
                added: true,
                message: 'Video uploaded successfully!'
            }

        }
        catch (err) {
            return {
                added: false,
                message: err.message
            }
        }
    }

}
