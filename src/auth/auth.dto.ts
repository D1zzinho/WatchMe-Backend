import {ApiProperty} from "@nestjs/swagger";

export class LoginDTO {
    @ApiProperty({ type: String, description: 'Username'})
    username: string;

    @ApiProperty({ type: String, description: 'Password'})
    password: string;
}


export class RegisterDTO extends LoginDTO {
    @ApiProperty({ type: String, description: 'Email'})
    email: string;
}


export class SaveGitHubUserDTO {
    @ApiProperty({ type: String, description: 'GitHub user login' })
    username: string;

    @ApiProperty({ type: String, description: 'GitHub user profile url' })
    url: string;

    @ApiProperty({ type: String, description: 'GitHub user avatar' })
    avatar: string;

    @ApiProperty({ type: String, description: 'GitHub user email' })
    email: string;

    @ApiProperty({ type: String, description: 'GitHub user name' })
    name: string;

    @ApiProperty({ type: String, description: 'GitHub user bio' })
    about: string;
}
