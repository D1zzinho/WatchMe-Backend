import {HttpService, Injectable, UnauthorizedException} from '@nestjs/common';
import {sign} from 'jsonwebtoken';
import {UserService} from "../users/users.service";
import {Payload} from "../types/payload";
import {User} from "../users/schemas/user.schema";


@Injectable()
export class AuthService {
    constructor(private userService: UserService, private http: HttpService) {}

    async signPayload(payload: Payload): Promise<string> {
        return sign(payload, 'secretKey', { expiresIn: '12h' });
    }

    async signGitHubPayload(payload: any): Promise<string> {
        const jwtData = {
            username: payload.user.login,
            type: 'github',
            permissions: payload.permissions,
            access_token: payload.token.access_token
        };

        const exp = '8h';

        return sign(jwtData, 'secretKey', { expiresIn: exp });
    }

    async validateUser(payload: Payload): Promise<User> {
        return this.userService.findByPayload(payload);
    }


    async getAccessToken({ code, client_id, client_secret }): Promise<URLSearchParams> {
        try {
            const request = await this.http.post("https://github.com/login/oauth/access_token", {
                client_id,
                client_secret,
                code
            }, { headers: { accept: 'application/json' } }).toPromise();

            return request.data;
        }
        catch (err) {
            console.log(err);
        }
    }


    async getGitHubUser(token: any): Promise<any> {
        try {
            const request = await this.http.get("https://api.github.com/user", {
                headers: {
                    Authorization: `token ${token.access_token}`
                }
            }).toPromise();

            return request.data;
        }
        catch (err) {
            throw new UnauthorizedException(err);
        }
    }
}
