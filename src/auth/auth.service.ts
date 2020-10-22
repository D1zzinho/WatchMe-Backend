import { Injectable } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import {UserService} from "../users/users.service";
import {Payload} from "../types/payload";
import {User} from "../users/schemas/user.schema";



@Injectable()
export class AuthService {
    constructor(private userService: UserService) {}

    async signPayload(payload: Payload): Promise<string> {
        return sign(payload, 'secretKey', { expiresIn: '12h' });
    }

    async validateUser(payload: Payload): Promise<User> {
        return this.userService.findByPayload(payload);
    }
}
