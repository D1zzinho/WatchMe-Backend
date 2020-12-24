import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {ExtractJwt, Strategy, VerifiedCallback} from "passport-jwt";
import {PassportStrategy} from "@nestjs/passport";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'secretKey'
        });
    }

    async validate(payload: any, done: VerifiedCallback): Promise<void> {
        if (!payload.type) {
            const user = await this.authService.validateUser(payload);
            if (!user) {
                return done(
                    new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED),
                    false,
                );
            }

            return done(null, { _id: user._id, username: user.username, permissions: user.permissions, avatar: user.avatar, email: user.email }, payload.iat);
        }
        else {
            const user = await this.authService.getGitHubUser(payload);
            if (!user) {
                return done(
                    new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED),
                    false,
                );
            }

            return done(null, { username: user.login, avatar: user.avatar_url, type: 'github', access_token: payload.access_token });
        }
    }
}
