import {Types, Model} from 'mongoose';
import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Video} from "./schemas/video.schema";
import {User} from "../users/schemas/user.schema";
import {UpdateVideoResponseSchema} from "./schemas/updateVideoResponse.schema";
import {GitHubUser} from "../users/schemas/gitHubUser.schema";


@Injectable()
export class VideosService {
    constructor(
        @InjectModel(Video.name) private readonly videoModel: Model<Video>,
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(GitHubUser.name) private readonly gitHubUserModel: Model<GitHubUser>
    ) {}


    async findAll(): Promise<Video[]> {
        const aggregation = [
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
                    'uploadDate': '$videos.uploadDate',
                    'author': '$username'
                }
            }, {
                '$sort': {
                    'uploadDate': -1
                }
            }
        ];

        const userVideos = await this.userModel.aggregate(aggregation);
        const gitHubUserVideos = await this.gitHubUserModel.aggregate(aggregation);

        let videos = userVideos.concat(gitHubUserVideos);
        videos = videos.sort((a,b) => (new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
        return videos;
    }


    async findVideo(id: string): Promise<Video[]> {
        const aggregation = [
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
                    'author': '$username',
                    'authorAvatar': '$avatar',
                    'uploadDate':'$videos.uploadDate'
                }
            }
        ];

        const userVideo = await this.userModel.aggregate(aggregation);
        const gitHubUserVideo = await this.gitHubUserModel.aggregate(aggregation)

        const video = userVideo.concat(gitHubUserVideo)

        if (video[0] == null) {
            throw new NotFoundException('Video not found!');
        }

        return video;
    }


    async getLatest(limit: number): Promise<Video[]> {
        const aggregation = [
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
                    'uploadDate': '$videos.uploadDate',
                    'author': '$username'
                }
            }, {
                '$sort': {
                    'uploadDate': -1
                }
            }
        ];

        const userVideos = await this.userModel.aggregate(aggregation);
        const gitHubUserVideos = await this.gitHubUserModel.aggregate(aggregation);
        let latestVideos = userVideos.concat(gitHubUserVideos);
        latestVideos = latestVideos.sort((a,b) => (new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
        latestVideos = latestVideos.slice(0,limit);
        return latestVideos
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
                'author': '$username',
                'uploadDate':'$videos.uploadDate'
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

        // matchingQuery.push({
        //     '$sort': {
        //         'id': -1
        //     }
        // })

        const userVideos = await this.userModel.aggregate(matchingQuery);
        const gitHubUserVideos = await this.gitHubUserModel.aggregate(matchingQuery);

        let allVideos = userVideos.concat(gitHubUserVideos);
        allVideos = allVideos.sort((a,b) => (new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));

        return allVideos;
    }


    async findSimilarVideos(id: string): Promise<Array<Video>> {
        const aggregation = [
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
        ];

        let tags;

        const tagsFromSelectedVideo = await this.userModel.aggregate(aggregation);
        if (tagsFromSelectedVideo[0]) {
            tags = tagsFromSelectedVideo[0].tags;
        }
        else {
            const tagsFromGitHubVideo = await this.gitHubUserModel.aggregate(aggregation);
            tags = tagsFromGitHubVideo[0].tags
        }


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

        const videos = await this.userModel.aggregate(matchingQuery);
        const gitHubVideos = await this.gitHubUserModel.aggregate(matchingQuery);

        return videos.concat(gitHubVideos);
    }


    async getMostUsedTags(): Promise<Array<{ tag: string, count: number }>> {
        return this.userModel.aggregate([
            {
                '$project': {
                    '_id': 0,
                    'tags': '$videos.tags'
                }
            }, {
                '$unwind': {
                    'path': '$tags',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$unwind': {
                    'path': '$tags',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$group': {
                    '_id': '$tags',
                    'count': {
                        '$sum': 1
                    }
                }
            }, {
                '$project': {
                    '_id': 0,
                    'tag': '$_id',
                    'count': '$count'
                }
            }, {
                '$sort': {
                    'count': -1
                }
            }, {
                '$limit': 100
            }
        ]);
    }


    async addVideo(video: Video, id: string, type: string): Promise<Object> {
        try {
            const newVideo = new this.videoModel(video);

            if (type == null) {
                await this.userModel.findByIdAndUpdate(id, { $push: { videos: newVideo } });
            }
            else {
                await this.gitHubUserModel.findOneAndUpdate({ username: id }, { $push: { videos: newVideo }});
            }

            return {
                added: true,
                video: newVideo,
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


    // async updateDate(videoId: string): Promise<void> {
    //     const aggregation = [
    //         {
    //             '$unwind': {
    //                 'path': '$videos',
    //                 'includeArrayIndex': 'id',
    //                 'preserveNullAndEmptyArrays': true
    //             }
    //         }, {
    //             '$match': {
    //                 'videos._id': Types.ObjectId(videoId)
    //             }
    //         }
    //         ];
    //     const userVideo = await this.userModel.aggregate(aggregation);
    //
    //     if (userVideo[0] != undefined) {
    //         await this.userModel.updateOne({ 'videos._id': Types.ObjectId(videoId) }, { $set: { 'videos.$.uploadDate': new Date('2020-08-08') } });
    //     }
    //     else {
    //         await this.gitHubUserModel.updateOne({ 'videos._id': Types.ObjectId(videoId) }, { $set: { 'videos.$.uploadDate': new Date('2020-08-08') } });
    //     }
    // }


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
