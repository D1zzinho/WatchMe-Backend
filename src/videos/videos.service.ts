import {Types, Model, MongooseUpdateQuery} from 'mongoose';
import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Video} from "./schemas/video.schema";
import {User} from "../users/schemas/user.schema";
import {AuthService} from "../auth/auth.service";
import {UpdateVideoResponseSchema} from "./schemas/updateVideoResponse.schema";


@Injectable()
export class VideosService {
    constructor(@InjectModel(Video.name) private readonly videoModel: Model<Video>, @InjectModel(User.name) private readonly userModel: Model<User>, private authService: AuthService) {}


    async findAll(): Promise<Video[]> {
        return this.userModel.aggregate([
            {
                '$unwind': {
                    'path': '$videos',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$project': {
                    '_id': 0,
                    'id': '$videos._id',
                    'title': '$videos.title',
                    'desc': '$videos.desc',
                    'tags': '$videos.tags',
                    'path': '$videos.path',
                    'thumb': '$videos.thumb',
                    'cover': '$videos.cover',
                    'visits': '$videos.visits',
                    'stat': '$videos.stat',
                    'author': '$username'
                }
            }, {
                '$sort': {
                    'id': -1
                }
            }
        ]);
    }


    async findVideo(id: string): Promise<Video[]> {
        const video = this.userModel.aggregate([
            {
                '$unwind': {
                    'path': '$videos',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$match': {
                    'videos._id': Types.ObjectId(id)
                }
            }, {
                '$project': {
                    '_id': 0,
                    'id': '$videos._id',
                    'title': '$videos.title',
                    'desc': '$videos.desc',
                    'tags': '$videos.tags',
                    'path': '$videos.path',
                    'thumb': '$videos.thumb',
                    'cover': '$videos.cover',
                    'visits': '$videos.visits',
                    'stat': '$videos.stat',
                    'author': '$username'
                }
            }
        ]);

        if (video[0] === null) {
            throw new NotFoundException('Video not found!');
        }

        return video;
    }


    async getLatest(limit: number): Promise<Video[]> {
        return this.userModel.aggregate([
            {
                '$unwind': {
                    'path': '$videos',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$project': {
                    '_id': 0,
                    'id': '$videos._id',
                    'title': '$videos.title',
                    'desc': '$videos.desc',
                    'tags': '$videos.tags',
                    'path': '$videos.path',
                    'thumb': '$videos.thumb',
                    'cover': '$videos.cover',
                    'visits': '$videos.visits',
                    'stat': '$videos.stat',
                    'author': '$username'
                }
            }, {
                '$sort': {
                    'id': -1
                }
            }, {
                '$limit': Number(limit)
            }
        ]);
    }


    async searchVideosByQuery(query: string): Promise<Video[]> {
        const matchingQuery = new Array<Object>();
        matchingQuery.push({
            '$unwind': {
                'path': '$videos',
                'includeArrayIndex': 'id',
                'preserveNullAndEmptyArrays': true
            }
        });
        matchingQuery.push({
            '$project': {
                '_id': 0,
                'id': '$videos._id',
                'title': '$videos.title',
                'desc': '$videos.desc',
                'tags': '$videos.tags',
                'path': '$videos.path',
                'thumb': '$videos.thumb',
                'cover': '$videos.cover',
                'visits': '$videos.visits',
                'stat': '$videos.stat',
                'author': '$username'
            }
        });

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

        matchingQuery.push({
            '$sort': {
                'id': -1
            }
        })

        return this.userModel.aggregate(matchingQuery);
    }


    async findSimilarVideos(id: string): Promise<Array<Video>> {
        const tagsFromSelectedVideo = await this.userModel.aggregate([
            {
                '$unwind': {
                    'path': '$videos',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$match': {
                    'videos._id': Types.ObjectId(id)
                }
            }, {
                '$project': {
                    '_id': 0,
                    'tags': '$videos.tags'
                }
            }
        ]);
        const tags = tagsFromSelectedVideo[0].tags;

        const matchingQuery = new Array<Object>();
        const insideQuery = new Array<Object>();

        matchingQuery.push({
            '$unwind': {
                'path': '$videos',
                'includeArrayIndex': 'id',
                'preserveNullAndEmptyArrays': true
            }
        });
        matchingQuery.push({
            '$project': {
                '_id': 0,
                'id': '$videos._id',
                'title': '$videos.title',
                'desc': '$videos.desc',
                'tags': '$videos.tags',
                'path': '$videos.path',
                'thumb': '$videos.thumb',
                'cover': '$videos.cover',
                'visits': '$videos.visits',
                'stat': '$videos.stat',
                'author': '$username'
            }
        });

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
        });

        return this.userModel.aggregate(matchingQuery);
    }


    async addVideo(video: Video, id: string): Promise<Object> {
        try {
            const newVideo = new this.videoModel(video);

            await this.userModel.findByIdAndUpdate(id, { $push: { videos: newVideo } });

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


    async deleteVideo(id: string): Promise<{ deleted: boolean, message: string }> {
        try {
            const deleteVideo = await this.userModel.findOneAndUpdate({
                'videos._id': Types.ObjectId(id)
            }, {
                $pull: { 'videos': { '_id': Types.ObjectId(id) } }
            });

            if (deleteVideo) {
                return {
                    deleted: true,
                    message: 'Video deleted successfully!'
                }
            }
            else {
                return {
                    deleted: false,
                    message: 'Video deleting error!'
                }
            }
        }
        catch (err) {
            return {
                deleted: false,
                message: err.message
            }
        }
    }


    async updateViews(id: string): Promise<Object> {
        try {
            await this.userModel.updateOne({ 'videos._id': Types.ObjectId(id) }, { $inc: { 'videos.$.visits': 1 } });

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


    async updateTitle(id: string, title: string): Promise<Object> {
        return this.userModel.updateOne({'videos._id': Types.ObjectId(id)}, {$set: {'videos.$.title': title}});
    }


    async updateDesc(id: string, desc: string): Promise<Object> {
        return this.userModel.updateOne({'videos._id': Types.ObjectId(id)}, {$set: {'videos.$.desc': desc}});
    }


    async updateTags(id: string, tags: Array<string>): Promise<Object> {
        return this.userModel.updateOne({'videos._id': Types.ObjectId(id)}, {$set: {'videos.$.tags': tags}});
    }


    async updateStat(id: string): Promise<UpdateVideoResponseSchema> {
        let message;
        const video = await this.userModel.aggregate([
                {
                    '$unwind': {
                        'path': '$videos',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$match': {
                        'videos._id': Types.ObjectId(id)
                    }
                }, {
                    '$project': {
                        '_id': 0,
                        'id': '$videos._id',
                        'title': '$videos.title',
                        'desc': '$videos.desc',
                        'tags': '$videos.tags',
                        'path': '$videos.path',
                        'thumb': '$videos.thumb',
                        'cover': '$videos.cover',
                        'visits': '$videos.visits',
                        'stat': '$videos.stat',
                        'author': '$username'
                    }
                }
            ]);

        if (video.length > 0) {
            const currentStat = Number(video[0].stat);

            if (currentStat === 1) {
                await this.userModel.updateOne({ 'videos._id': Types.ObjectId(id) }, { $set: { 'videos.$.stat': 0 } });
                message = 'Video publication status successfully changed to private!';
            }
            else {
                await this.userModel.updateOne({ 'videos._id': Types.ObjectId(id) }, { $set: { 'videos.$.stat': 1 } });
                message = 'Video publication status successfully changed to public!';
            }

            return {
                updated: true,
                message: message
            }
        }
        else {
            message = 'Video not found!';

            return {
                updated: false,
                message: message
            }
        }
    }


    removeAllWithWantedName(arr, value): Promise<Array<Video>> {
        let i = 0;
        while (i < arr.length) {
            if (arr[i].id.toString() === value) {
                arr.splice(i, 1);
            } else {
                ++i;
            }
        }

        return arr;
    }

}
