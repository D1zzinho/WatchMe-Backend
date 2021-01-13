import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Video} from "../videos/schemas/video.schema";
import {Comment} from "./schemas/comment.schema";
import {Model, Types} from "mongoose";
import {User} from "../users/schemas/user.schema";
import {GitHubUser} from "../users/schemas/gitHubUser.schema";

@Injectable()
export class CommentsService {
    constructor(
        @InjectModel(Video.name) private readonly videoModel: Model<Video>,
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(GitHubUser.name) private readonly gitHubUserModel: Model<GitHubUser>,
        @InjectModel(Comment.name) private readonly commentModel: Model<Comment>
    ) {}


    async findAll(): Promise<Comment[]> {
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
                    'id': '$comments._id',
                    'text': '$comments.text',
                    'date': '$comments.date',
                    'author': '$username'
                }
            }, {
                '$sort': {
                    'date': -1
                }
            }
        ]);
    }


    async findComment(id: string): Promise<Comment[]> {
        const aggregation = [
            {
                '$unwind': {
                    'path': '$comments',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$match': {
                    'comments._id': Types.ObjectId(id)
                }
            }, {
                '$project': {
                    '_id': 0,
                    'text': '$comments.text',
                    'date': '$comments.date',
                    'author': '$username',
                    'authorAvatar': '$avatar'
                }
            }
        ];

        let comment = await this.userModel.aggregate(aggregation);

        if (comment.length === 0) {
            comment = await this.gitHubUserModel.aggregate(aggregation);
        }

        if (comment[0] === null) {
            throw new NotFoundException('Comment not found!');
        }

        return comment;
    }


    async findCommentsToVideo(videoId: string): Promise<Comment[]> {
        const aggregation = [
            {
                '$unwind': {
                    'path': '$comments',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$match': {
                    'comments.video': Types.ObjectId(videoId)
                }
            }, {
                '$project': {
                    '_id': 0,
                    'id': '$comments._id',
                    'text': '$comments.text',
                    'date': '$comments.date',
                    'author': '$username',
                    'authorAvatar': '$avatar'
                }
            }, {
                '$sort': {
                    'date': -1
                }
            }
        ];

        const comments = await this.userModel.aggregate(aggregation);
        const gitHubComments = await this.gitHubUserModel.aggregate(aggregation);

        let allComments = comments.concat(gitHubComments);

        if (allComments[0] === null) {
            throw new NotFoundException('Comments not found!');
        }
        else {
            allComments = allComments.sort((a,b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
        }

        return allComments;
    }


    async addComment(user: string, comment: any, userType: string): Promise<any> {
        const newComment = new this.commentModel(comment);
        let model;

        if (userType === null) {
            model = this.userModel;

            await model.findByIdAndUpdate(user, {$push: {comments: newComment}});

            return newComment;
        }
        else {
            model = this.gitHubUserModel;

            await model.findOneAndUpdate({ username: user }, {$push: {comments: newComment}});

            return newComment;
        }
    }


    async editComment(user: string, commentId: string, newMessage: string): Promise<any> {
        let model;

        const checkUser = await this.userModel.findOne({ username: user });

        if (checkUser) {
            model = this.userModel;

            await model.updateOne({ "comments._id": Types.ObjectId(commentId) }, { "$set": { "comments.$.text": newMessage } });
        }
        else {
            model = this.gitHubUserModel;

            await model.updateOne({ "comments._id": Types.ObjectId(commentId) }, { "$set": { "comments.$.text": newMessage } });
        }
        // if (userType === null) {
        //
        // }
        // else {
        //
        // }
    }


    async deleteComment(user: string, commentId: string): Promise<any> {
        let model;

        const checkUser = await this.userModel.findOne({ username: user });

        if (checkUser) {
            model = this.userModel;

            await model.updateOne({ "comments._id": Types.ObjectId(commentId) }, { "$pull": { "comments": { "_id": Types.ObjectId(commentId) } } });
        }
        else {
            model = this.gitHubUserModel;

            await model.updateOne({ "comments._id": Types.ObjectId(commentId) }, { "$pull": { "comments": { "_id": Types.ObjectId(commentId) } } });
        }
    }

}
