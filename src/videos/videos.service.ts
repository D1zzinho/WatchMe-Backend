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

        const titleQuery = new Array<Object>();
        const descQuery = new Array<Object>();
        const tagsQuery = new Array<Object>();

        const words = query.split(' ');
        if (words.length > 0) {
            words.forEach(word => {
                titleQuery.push({
                    'title': new RegExp(word, 'i')
                });

                descQuery.push({
                    'desc': new RegExp(word, 'i')
                });

                tagsQuery.push({
                    'tags': new RegExp(word, 'i')
                });
            });

            matchingQuery.push({
                '$match': {
                    '$or': [
                        {
                            '$and': titleQuery
                        },
                        {
                            '$and': descQuery
                        },
                        {
                            '$and': tagsQuery
                        }
                    ]
                }
            })
        }
        else {
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
        }

        const videos = this.videoModel.aggregate(matchingQuery).sort({ _id: -1 });

        return videos;
    }


    async findSimilarVideos(tags: Array<string>): Promise<Array<Video>> {
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


    async updateViews(id: string): Promise<Object> {
        try {
            await this.videoModel.findByIdAndUpdate(id, { $inc: { visits: 1 }});

            return {
                updated: true,
                message: 'Added view!'
            }
        }
        catch (err) {
            return {
                updated: false,
                message: err.message
            }
        }
    }


    removeAllWithWantedName(arr, value): Promise<Array<Video>> {
        let i = 0;
        while (i < arr.length) {
            if (arr[i]._id.toString() === value) {
                arr.splice(i, 1);
            } else {
                ++i;
            }
        }

        return arr;
    }

}
