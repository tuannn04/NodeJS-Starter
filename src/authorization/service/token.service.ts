import {Injectable} from "@nestjs/common";
import {Token, TokenDocument} from "../schemas/token.schema";
import {InjectModel} from "@nestjs/mongoose";
import DatabaseConstant from "../constant/database.constant";
import {Model} from "mongoose";
import {AccountService} from "../../account/service/account.service";
import {ConfigService} from "./config.service";
import {randomBytes} from "crypto";
import TokenConstant from "../constant/token.constant";

@Injectable()
export class TokenService {
    constructor(
        @InjectModel(Token.name, DatabaseConstant.DB_CONNECTION_NAME) private tokenModel: Model<TokenDocument>,
        private readonly accountService: AccountService,
        private readonly configService: ConfigService
    ) {
    }

    async create(userId: string, userType: string): Promise<Token> {
        const filter = {user_id: userId, user_type: userType};
        const updatedData = {
            access_token: this.generateAccessToken(),
            refresh_token: this.generateRefreshToken()
        };
        if (this.configService.isMultipleLoginSession()) {
            const token = new this.tokenModel({...filter, ...updatedData});
            return await token.save();
        } else {
            const query = this.tokenModel.findOneAndUpdate(filter, updatedData, {upsert: true, new: true});
            return await query.exec();
        }
    }

    async getByAccessToken(accessToken: string): Promise<Token> {
        const filter = {access_token: accessToken};
        const query = this.tokenModel.findOne(filter);
        return await query.exec();
    }

    private generateAccessToken(): string {
        return randomBytes(TokenConstant.ACCESS_TOKEN_LENGTH).toString('hex');
    }

    private generateRefreshToken(): string {
        return randomBytes(TokenConstant.REFRESH_TOKEN_LENGTH).toString('hex');
    }
}