import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
    @Prop({ required: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    email: string;

    @Prop()
    firstname: string;

    @Prop()
    lastname: string;

    @Prop()
    about: string;

    @Prop({ default: 1 })
    permissions: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
