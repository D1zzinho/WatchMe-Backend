import { Injectable } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import {UserService} from "../users/users.service";
import {Payload} from "../types/payload";



@Injectable()
export class AuthService {
    constructor(private userService: UserService) {}

    async signPayload(payload: Payload) {
        return sign(payload, 'secretKey', { expiresIn: '12h' });
    }

    async validateUser(payload: Payload) {
        return this.userService.findByPayload(payload);
    }
}
