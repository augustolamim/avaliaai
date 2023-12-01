"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Yup = __importStar(require("yup"));
const database_1 = require("../database");
const replicate_1 = __importDefault(require("../config/replicate"));
class GradeController {
    async store(request, response) {
        try {
            const schema = Yup.object().shape({
                answer: Yup.string().required()
            });
            try {
                await schema.validate(request.body, { abortEarly: false });
            }
            catch (validationError) {
                console.log(typeof validationError);
                return response.status(400).json({ errors: validationError.errors });
            }
            const { answer } = request.body;
            const { id } = request.params;
            if (!id) {
                return response.status(400).json({
                    error: 'O ID deve ser informado.'
                });
            }
            const question = await database_1.db
                .selectFrom('question')
                .where('id', '=', id)
                .selectAll()
                .execute();
            const answers = await database_1.db
                .selectFrom('answer')
                .where('answer.question_id', '=', id)
                .selectAll()
                .execute();
            const prompt = "<|system|>Based on this array of answers with scores and feedbacks" + JSON.stringify(answers) + "generate a score and feedback for this new answer:\"" + answer + "\" DO NOT send anything other then a number for the score and the feedback, dont need text like score: or this is the feedback: </s>";
            let i = 0;
            while (i < 5) {
                console.log("count: " + i);
                const output = await replicate_1.default.run("tomasmcm/zephyr-7b-beta:961cd6665b811d0c43c0b9488b6dfa85ff5c7bfb875e93b4533e4c7f96c7c526", {
                    input: {
                        top_k: 50,
                        top_p: 0.95,
                        prompt: prompt,
                        temperature: 0.8,
                        max_new_tokens: 128,
                        presence_penalty: 1
                    }
                });
                const outputstring = output;
                const regex = /Score: (\d+)[\s\S]*?Feedback: ([^\n]+)/;
                ;
                console.log(output);
                const match = outputstring.match(regex);
                if (match) {
                    const score = parseInt(match[1], 10); // Convert the matched score to an integer
                    const feedback = match[2];
                    return response.status(201).json({
                        score, feedback
                    });
                }
                i++;
            }
            // Check if there is a match           
            return response.status(400).json({
                message: "bad request"
            });
        }
        catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao salvar os dados.',
                stack: error,
                local: 'Checklist.update',
            });
        }
    }
}
exports.default = new GradeController();
