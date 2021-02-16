import {
    Body,
    Controller, Delete,
    Get,
    Param, Patch,
    Post,
    Query, Req,
    Res,
    UploadedFile, UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {VideosService} from "./videos.service";
import paginate from "jw-paginate";
import {diskStorage} from 'multer';
import {FileInterceptor} from "@nestjs/platform-express";
import {editFileName, generateThumbAndPreview, videoFileFilter} from './utils/upload.utils';
import {AuthGuard} from "@nestjs/passport";
import {Video} from "./schemas/video.schema";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody, ApiCreatedResponse,
    ApiOkResponse,
    ApiParam, ApiQuery,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import * as fs from "fs";
import {Request, Response} from "express";
import {User} from "../users/schemas/user.schema";
import {UpdateVideoResponseSchema} from "./schemas/updateVideoResponse.schema";


@Controller('videos')
export class VideosController {

    constructor(private readonly videosService: VideosService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ schema: { type: 'object', properties: { pages: { type: 'object', example: {}}, videosOnPage: { type: 'array', example: []} } }, description: 'Videos with pagination' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async getAllVideosWithPagination(@Res() res: Response, @Query('page') pageParam: any): Promise<Response<JSON>> {
        try {
            const videos = await this.videosService.findAll();

            const page = parseInt(pageParam) || 1;

            const pageSize = 16;
            const pages = paginate(videos.length, page, pageSize);

            const videosOnPage = videos.slice(pages.startIndex, pages.endIndex + 1);

            return await res.json({ pages, videosOnPage });
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Get('/all')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: [Video], description: 'All videos' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async getAllVideos(@Res() res: Response): Promise<Response<Video[]>> {
        try {
            const videos = await this.videosService.findAll();
            return res.json(videos);
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Get('/latest')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: [Video], description: 'Videos with pagination' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiQuery({ name: 'limit', type: Number })
    async getLatestVideos(@Res() res: Response, @Query('limit') limit = 10): Promise<Response<Video[]>> {
        try {
            const videos = await this.videosService.getLatest(limit);

            if (videos.length > 0) {
                return res.json(videos);
            }
            else {
                return res.json({
                    message: 'Videos not found!'
                })
            }
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Get('/search')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async searchVideos(@Res() res: Response, @Query('query') query: string): Promise<Response> {
        try {
            let videos: Array<Video> = new Array<Video>();
            let message: string;
            let found = false;

            if (query !== '') {
                videos = await this.videosService.searchVideosByQuery(query);

                message = `Found ${videos.length} videos`;
                found = true;
            }
            else {
                message = `Query cannot be null!`;
            }

            return res.json({
                isResult: found,
                videos: videos,
                message: message
            });
        }
        catch (err) {
            return res.json({
                isResult: false,
                videos: null,
                message: err.message
            });
        }
    }


    @Get('/mostUsedTags')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ schema: { properties: { found: { type: 'boolean' }, message: { type: 'string' }, options: { type: 'array', items: { type: 'string' } } } }, description: 'Array of most used tags' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async getMostUsedTags(@Res() res: Response): Promise<Response<Array<string>>> {
        const options = new Array<string>();
        let message: string;
        let found: boolean;

        try {
            const getMostUsedTagsResult = await this.videosService.getMostUsedTags();

            getMostUsedTagsResult.forEach(res => {
                const trimmedTag = res.tag.trim();
                options.push(trimmedTag);
            });

            if (options.length > 0) {
                message = 'Most used tags found';
                found = true;
            }
            else {
                message = 'Most used tags not found';
                found = false;
            }
        }
        catch (err) {
            message = err.message;
            found = false;
        }

        return res.json({ found: found, message: message, options: options });
    }


    @Post('/upload')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './public/uploads',
            filename: editFileName
        }),
        fileFilter: videoFileFilter
    }))
    async addVideo(
        @Req() req: Request,
        @UploadedFile() file: any,
        @Body('video') newVideo: string,
        @Res() res: Response
    ): Promise<Response> {
        if (file !== undefined) {
            let data = null;

            const newVideoData = JSON.parse(newVideo);


            const user = <User> req.user;
            let id;
            let type;
            if (user['type']) {
                id = user['username']
                type = user['type']
            }
            else {
                id = user._id;
                type = null
            }


            const newPath = `uploads/${file.filename}`;
            const newCoverPath = `uploads/${file.filename.slice(0,-4)}.png`;
            const newThumbPath = `uploads/${file.filename.slice(0,-4)}_preview.webm`;

            newVideoData.path = newPath;
            newVideoData.cover = newCoverPath;
            newVideoData.thumb = newThumbPath;


            const saveVideoInDatabase = await this.videosService.addVideo(newVideoData, id, type).then(res => data = res);
            let conversion;
            if (data.added === true) { conversion = await generateThumbAndPreview(file.filename); }

            return res.json({
                conversion,
                file: file,
                saved: saveVideoInDatabase,
                uploaded: true
            });
        }
        return res.json({
            file: file,
            uploaded: false
        })
    }


    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: Video, description: 'Selected video by its id' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    async getVideo(@Res() res: Response, @Param('id') id: string): Promise<Response> {
        try {
            const video = await this.videosService.findVideo(id);
            return await res.json(video[0]);
        }
        catch (err) {
            return res.json({
                err: err.message
            });
        }
    }


    @Get(':id/similar')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: 'string', description: 'ObjectId of video for which similar videos want to be found by tags' })
    @ApiCreatedResponse({ type: [Video] })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async getSimilarVideosByTags(@Param('id') id: string, @Res() res: Response): Promise<Response<Video[]>> {
        try {
            const foundVideos = await this.videosService.findSimilarVideos(id);

            const videos = this.videosService.removeAllWithWantedName(foundVideos, id);

            return res.json(videos);
        }
        catch (err) {
            throw new Error(err.message);
        }
    }


    @Patch(':id/title')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: UpdateVideoResponseSchema, description: 'Video title successfully changed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiParam({ name: 'id', type: 'string', description: 'ObjectId of video user wants to edit' })
    @ApiBody({ schema: { type: 'object', properties: { title: { type: 'string' } } }, description: 'New video title is passed in request body' })
    async updateTitle(@Res() res: Response, @Param('id') id: string, @Body('title') title: string): Promise<Response<UpdateVideoResponseSchema>> {
        try {
            await this.videosService.updateTitle(id, title);

            return res.json({
                updated: true,
                message: 'Title successfully changed!'
            });
        }
        catch (err) {
            return res.json({
                updated: false,
                message: err.message
            })
        }
    }


    @Patch(':id/desc')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: UpdateVideoResponseSchema, description: 'Video description successfully changed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiParam({ name: 'id', type: 'string', description: 'ObjectId of video user wants to edit' })
    @ApiBody({ schema: { type: 'object', properties: { desc:  { type: 'string' } } }, description: 'New video description is passed in request body' })
    async updateDescription(@Res() res: Response, @Param('id') id: string, @Body('desc') desc: string): Promise<Response<UpdateVideoResponseSchema>> {
        try {
            await this.videosService.updateDesc(id, desc);

            return res.json({
                updated: true,
                message: 'Description successfully changed!'
            });
        }
        catch (err) {
            return res.json({
                updated: false,
                message: err.message
            })
        }
    }


    @Patch(':id/tags')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: UpdateVideoResponseSchema, description: 'Video tags successfully changed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiParam({ name: 'id', type: 'string', description: 'ObjectId of video user wants to edit' })
    @ApiBody({ schema: { type: 'object', properties: { tags: { type: 'string' } } }, description: 'New video tags are passed in request body' })
    async updateTags(@Res() res: Response, @Param('id') id: string, @Body('tags') tags: Array<string>): Promise<Response<UpdateVideoResponseSchema>> {
        try {
            await this.videosService.updateTags(id, tags);

            return res.json({
                updated: true,
                message: 'Tags successfully changed!'
            })
        }
        catch (err) {
            return res.json({
                updated: false,
                message: err.message
            })
        }

    }


    @Patch(':id/stat')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: UpdateVideoResponseSchema, description: 'Video publication status successfully changed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiParam({ name: 'id', type: 'string', description: 'ObjectId of video user wants to edit' })
    @ApiBody({ schema: { type: 'object', properties: { id: { type: 'string' } } }, description: 'ObjectId of video user wants to edit' })
    async updateStatus(@Res() res: Response, @Param('id') id: string, @Body('id') sameId: string): Promise<Response<UpdateVideoResponseSchema>> {
        try {
            if (sameId === id) {
                const updateStatusResult = await this.videosService.updateStat(id);

                return res.json({
                    updated: updateStatusResult.updated,
                    message: updateStatusResult.message
                })
            }
            else {
                return res.json({
                    updated: false,
                    message: 'Id error!'
                })
            }
        }
        catch (err) {
            return res.json({
                updated: false,
                message: err.message
            })
        }

    }


    @Patch(':id/views')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async updateViews(@Res() res: any, @Param('id') id: string): Promise<JSON> {
        try {
            const updateViews = await this.videosService.updateViews(id);

            return await res.json({
                updateViews
            })
        }
        catch (err) {
            return await res.json({
                message: err.message
            })
        }
    }


    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async deleteVideo(@Res() res: any, @Param('id') id: string): Promise<JSON> {
        try {
            const videoData = await this.videosService.findVideo(id);
            const video = videoData[0];

            if (video !== null) {
                const path = './public/';

                fs.unlinkSync(path + video.thumb);
                fs.unlinkSync(path + video.cover);
                fs.unlinkSync(path + video.path);

                const deleteVideo = await this.videosService.deleteVideo(id);
                
                return await res.json({
                    deleteVideo
                })
            }
            else {
                return await res.json({
                    message: 'Video does not exist!'
                })
            }
        }
        catch (err) {
            return await res.json({
                message: err.message
            })
        }
    }

}
