import {
    Body,
    Controller,
    Get,
    Param, Patch,
    Post,
    Query,
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


@Controller('videos')
export class VideosController {

    constructor(private readonly videosService: VideosService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getAllVideos(@Res() res, @Query('page') pageParam): Promise<JSON> {
        try {
            const videos = await this.videosService.findAll();

            const page = parseInt(pageParam) || 1;

            const pageSize = 12;
            const pages = paginate(videos.length, page, pageSize);

            const videosOnPage = videos.slice(pages.startIndex, pages.endIndex + 1);

            return res.json({ pages, videosOnPage });
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Get('/search')
    @UseGuards(AuthGuard('jwt'))
    async searchVideos(@Res() res, @Query('query') query, @Query('page') pageParam): Promise<JSON> {
        try {
            let videos: Array<Video> = new Array<Video>();
            let pages: any = null;
            let videosOnPage: Array<Video> = null;
            let message: string = null;
            let found: boolean = false;

            if (query !== '') {
                videos = await this.videosService.searchVideosByQuery(query);

                const page = parseInt(pageParam) || 1;
                const pageSize = 12;

                pages = paginate(videos.length, page, pageSize);
                videosOnPage = videos.slice(pages.startIndex, pages.endIndex + 1);

                message = `Found ${videos.length} videos`;
                found = true;
            }
            else {
                message = `Query cannot be null!`;
            }

            return res.json({
                isResult: found,
                pages,
                videosOnPage,
                message: message
            });
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Post('/similar')
    @UseGuards(AuthGuard('jwt'))
    async getSimilarVideos(@Body('tags') tags: Array<string>, @Res() res): Promise<JSON> {
        try {
            const videos = await this.videosService.findSimilarVideos(tags);
            return res.json(videos);
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Post('/upload')
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './public/uploads',
            filename: editFileName
        }),
        fileFilter: videoFileFilter
    }))
    async addVideo(@UploadedFile() file, @Body('video') newVideo: string, @Res() res): Promise<JSON> {
        if (file !== undefined) {
            let data = null;
            const saveVideoInDatabase = await this.videosService.addVideo(JSON.parse(newVideo)).then(res => data = res);

            if (data.added === true) { generateThumbAndPreview(file.filename); }

            return res.json({
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


    @Patch('views')
    @UseGuards(AuthGuard('jwt'))
    async updateVideoViews(@Res() res, @Body('id') id): Promise<JSON> {
        try {
            const updateViews = await this.videosService.updateViews(id);

            return res.json({
                updateViews
            })
        }
        catch (err) {
            return res.json({
                message: err.message
            })
        }
    }


    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    async getVideo(@Res() res, @Param('id') id): Promise<JSON> {
        try {
            const video = await this.videosService.findVideo(id);
            return res.json(video);
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }

}
