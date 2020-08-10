import { Controller, Get } from '@nestjs/common';

@Controller('videos')
export class VideosController {

    @Get()
    videosPage() {
        return 'videos';
    }
    
}
