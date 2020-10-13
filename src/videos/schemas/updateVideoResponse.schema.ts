import {ApiProperty} from "@nestjs/swagger";

export class UpdateVideoResponseSchema {
    @ApiProperty({ description: 'Boolean status of edit action' })
    updated: boolean;

    @ApiProperty({ description: 'Message returned by edit action' })
    message: string;
}
