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
