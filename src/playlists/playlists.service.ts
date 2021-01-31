import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Video} from "../videos/schemas/video.schema";
import {Model, Types} from "mongoose";
import {User} from "../users/schemas/user.schema";
import {GitHubUser} from "../users/schemas/gitHubUser.schema";
import {Playlist} from "./schemas/playlist.schema";
import {VideosService} from "../videos/videos.service";

@Injectable()
export class PlaylistsService {
    constructor(
        @InjectModel(Playlist.name) private readonly playlistModel: Model<Playlist>,
        @InjectModel(Video.name) private readonly videoModel: Model<Video>,
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(GitHubUser.name) private readonly gitHubUserModel: Model<GitHubUser>,
        private readonly videoService: VideosService
    ) {}


    async findUserPlaylists(user: any): Promise<Playlist[]> {
        let model;

        if (user['type'] === undefined) {
            model = this.userModel;

            return await model.findById(user['_id']).select('_id username playlists');
        }
        else {
            model = this.gitHubUserModel;

            return await model.findById(user['_id']).select('_id username playlists');
        }
    }


    async findPlaylist(id: string): Promise<Playlist> {
        const aggregation = [
            {
                '$unwind': {
                    'path': '$playlists',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$match': {
                    'playlists._id': Types.ObjectId(id)
                }
            }, {
                '$project': {
                    '_id': '$playlists._id',
                    'name': '$playlists.name',
                    'isPrivate': '$playlists.isPrivate',
                    'videos': '$playlists.videos',
                    'author': '$username',
                    'authorId': '$_id'
                }
            }
        ];

        const userPlaylist = await this.userModel.aggregate(aggregation);
        const gitHubUserPlaylist = await this.gitHubUserModel.aggregate(aggregation)

        const playlist = userPlaylist.concat(gitHubUserPlaylist)

        if (playlist[0] == null) {
            throw new NotFoundException('Playlist not found!');
        }

        return playlist[0];
    }


    async createEmptyNamedPlaylist(user: any, name: string, isPrivate: boolean): Promise<any> {
        const playlist = {
            name,
            isPrivate
        };

        const newNamedPlaylist = new this.playlistModel(playlist);
        let model;

        if (user['type'] === undefined) {
            model = this.userModel;

            await model.findByIdAndUpdate(user['_id'], { $push: { playlists: newNamedPlaylist }});
        }
        else {
            model = this.gitHubUserModel;

            await model.findByIdAndUpdate(user['_id'], { $push: { playlists: newNamedPlaylist }});
        }

        return newNamedPlaylist;
    }


    async createAutoPlaylist(user: any, videoId: string): Promise<any> {
        const video = await this.videoService.findVideo(videoId);

        const videos = new Array<any>();
        videos.push({
            _id: video[0]['id'],
            title: video[0]['title'],
            author: video[0]['author'],
            desc: video[0]['desc'],
            thumb: video[0]['thumb'],
            cover: video[0]['cover']
        })

        const playlist = {
            name: `playlist-${user['username']}-${Date.now()}`,
            videos
        };

        const newPlaylist = new this.playlistModel(playlist);
        let model;

        if (user['type'] === undefined) {
            model = this.userModel;

            await model.findByIdAndUpdate(user['_id'], { $push: { playlists: newPlaylist }});
        }
        else {
            model = this.gitHubUserModel;

            await model.findByIdAndUpdate(user['_id'], { $push: { playlists: newPlaylist }});
        }

        return newPlaylist;
    }


    async addVideoToPlaylist(user: any, playlistId: string, videoId: string): Promise<any> {
        const video = await this.videoService.findVideo(videoId);
        const newVideoInPlaylist = {
            _id: video[0]['id'],
            title: video[0]['title'],
            author: video[0]['author'],
            desc: video[0]['desc'],
            thumb: video[0]['thumb'],
            cover: video[0]['cover']
        };


        let model;
        if (user['type'] === undefined) {
            model = this.userModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$push": {"playlists.$.videos": newVideoInPlaylist}});
        }
        else {
            model = this.gitHubUserModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$push": {"playlists.$.videos": newVideoInPlaylist}});
        }

        return newVideoInPlaylist;
    }


    async deleteVideoFromPlaylist(user: any, playlistId: string, videoId: string): Promise<any> {
        const video = await this.videoService.findVideo(videoId);

        let model;
        if (user['type'] === undefined) {
            model = this.userModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$pull": {"playlists.$.videos": { "title": video[0].title }}});
        }
        else {
            model = this.gitHubUserModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$pull": {"playlists.$.videos": { "title": video[0].title }}});
        }
    }
}
