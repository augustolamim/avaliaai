"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const replicate_1 = __importDefault(require("replicate"));
require("dotenv/config");
const replicate = new replicate_1.default({
    auth: process.env.REPLICATE_API_TOKEN,
});
exports.default = replicate;
