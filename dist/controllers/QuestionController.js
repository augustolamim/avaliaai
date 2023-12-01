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
Object.defineProperty(exports, "__esModule", { value: true });
const Yup = __importStar(require("yup"));
const database_1 = require("../database");
class QuestionController {
    async index(request, response) {
        try {
            const questions = await database_1.db
                .selectFrom('question')
                .selectAll()
                .execute();
            return response.status(200).json({
                questions,
            });
        }
        catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao carregar os dados.',
                stack: error,
                local: 'SurgeryRoom.index',
            });
        }
    }
    async show(request, response) {
        try {
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
                .select(['text', 'feedback', 'score'])
                .execute();
            if (!question)
                return response.status(400).json({ error: 'Pergunta não encontrada.' });
            return response.status(200).json({
                id: question[0].id,
                question: question[0].question,
                answers: answers,
            });
        }
        catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao carregar os dados.',
                stack: error,
                local: 'SurgeryRoom.show',
            });
        }
    }
    async store(request, response) {
        try {
            const schema = Yup.object().shape({
                question: Yup.string().required(),
                answers: Yup.array().of(Yup.object().shape({
                    text: Yup.string().required(),
                    score: Yup.number().required(),
                    feedback: Yup.string().required(),
                })).required(),
            });
            try {
                await schema.validate(request.body, { abortEarly: false });
            }
            catch (validationError) {
                console.log(typeof validationError);
                return response.status(400).json({ errors: validationError.errors });
            }
            const { question, answers } = request.body;
            const newQuestion = await database_1.db
                .insertInto('question')
                .values({
                question: question
            })
                .returning(['id', 'question'])
                .executeTakeFirstOrThrow();
            const answersWithQuestionId = answers.map((answer) => ({
                ...answer,
                question_id: newQuestion.id, // Assuming you have the question id
            }));
            await database_1.db
                .insertInto('answer')
                .values(answersWithQuestionId)
                .execute();
            return response.status(201).json({
                id: newQuestion.id,
                question: newQuestion.question,
                answers: answersWithQuestionId,
            });
        }
        catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao salvar os dados.',
                stack: error,
                local: 'SurgeryRoom.store',
            });
        }
    }
    async update(request, response) {
        try {
            const schema = Yup.object().shape({
                question: Yup.string().required(),
                answers: Yup.array().of(Yup.object().shape({
                    text: Yup.string().required(),
                    score: Yup.number().required(),
                    feedback: Yup.string().required(),
                })).required(),
            });
            try {
                await schema.validate(request.body, { abortEarly: false });
            }
            catch (validationError) {
                console.log(typeof validationError);
                return response.status(400).json({ errors: validationError.errors });
            }
            const { question, answers } = request.body;
            const { id } = request.params;
            if (!id) {
                return response.status(400).json({
                    error: 'O ID deve ser informado.'
                });
            }
            const updatedQuestion = await database_1.db
                .updateTable('question')
                .set({
                question: question,
            })
                .where('id', '=', id)
                .returning(['id', 'question'])
                .executeTakeFirstOrThrow();
            const answersWithQuestionId = answers.map((answer) => ({
                ...answer,
                question_id: id, // Assuming you have the question id
            }));
            await database_1.db
                .deleteFrom('answer')
                .where('question_id', '=', id)
                .execute();
            await database_1.db
                .insertInto('answer')
                .values(answersWithQuestionId)
                .execute();
            return response.status(201).json({
                id: id,
                question: question,
                answers: answersWithQuestionId,
            });
        }
        catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao salvar os dados.',
                stack: error,
                local: 'SurgeryRoom.store',
            });
        }
    }
}
exports.default = new QuestionController();
