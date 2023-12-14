import { Response, Request } from 'express'
import * as Yup from 'yup';
import { db } from '../database';

class QuestionController {

    async index(request: Request, response: Response) {
        try {

            const questions = await db
                .selectFrom('question')
                .selectAll()
                .execute()
            return response.status(200).json({
                questions,
            });
        } catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao carregar os dados.',
                stack: error,
                local: 'SurgeryRoom.index',
            });
        }
    }

    async show(request: Request, response: Response) {

        try {
            const { id }: { id?: number } = request.params;
            if (!id) {
                return response.status(400).json({
                    error: 'O ID deve ser informado.'
                })
            }
            const question = await db
                .selectFrom('question')
                .where('id', '=', id)
                .selectAll()
                .execute()
            const answers = await db
                .selectFrom('answer')
                .where('answer.question_id', '=', id)
                .select(['text', 'feedback', 'score'])
                .execute()
            const logs = await db
                .selectFrom('log')
                .where('log.question_id', '=', id)
                .selectAll()
                .execute()

            if (!question) return response.status(400).json({ error: 'Pergunta não encontrada.' });

            return response.status(200).json({
                id: question[0].id,
                question: question[0].question,
                answers: answers,
                logs: logs
            });
        } catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao carregar os dados.',
                stack: error,
                local: 'SurgeryRoom.show',
            });
        }
    }
    async store(request: Request, response: Response) {
        try {
            const schema = Yup.object().shape({
                question: Yup.string().required(),
                answers: Yup.array().of(
                    Yup.object().shape({
                        text: Yup.string().required(),
                        score: Yup.number().required(),
                        feedback: Yup.string().required(),
                    })
                ).required(),
            });


            try {
                await schema.validate(request.body, { abortEarly: false });
            } catch (validationError: any) {
                console.log(typeof validationError)
                return response.status(400).json({ errors: validationError.errors });
            }

            const { question, answers } = request.body;


            const newQuestion = await db
                .insertInto('question')
                .values({
                    question: question
                })
                .returning(['id', 'question'])
                .executeTakeFirstOrThrow()
            const answersWithQuestionId = answers.map((answer: any) => ({
                ...answer,
                question_id: newQuestion.id, // Assuming you have the question id
            }))

            await db
                .insertInto('answer')
                .values(answersWithQuestionId)
                .execute()

            return response.status(201).json({
                id: newQuestion.id,
                question: newQuestion.question,
                answers: answersWithQuestionId,
            });
        } catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao salvar os dados.',
                stack: error,
                local: 'SurgeryRoom.store',
            });
        }
    }

    async update(request: Request, response: Response) {
        try {
            const schema = Yup.object().shape({
                question: Yup.string().required(),
                answers: Yup.array().of(
                    Yup.object().shape({
                        text: Yup.string().required(),
                        score: Yup.number().required(),
                        feedback: Yup.string().required(),
                    })
                ).required(),
            });


            try {
                await schema.validate(request.body, { abortEarly: false });
            } catch (validationError: any) {
                console.log(typeof validationError)
                return response.status(400).json({ errors: validationError.errors });
            }

            const { question, answers } = request.body;
            const { id }: { id?: number } = request.params;
            if (!id) {
                return response.status(400).json({
                    error: 'O ID deve ser informado.'
                })
            }
            const updatedQuestion = await db
                .updateTable('question')
                .set({
                    question: question,

                })
                .where('id', '=', id)
                .returning(['id', 'question'])
                .executeTakeFirstOrThrow()

            const answersWithQuestionId = answers.map((answer: any) => ({
                ...answer,
                question_id: id, // Assuming you have the question id
            }))
            await db
                .deleteFrom('answer')
                .where('question_id', '=', id)
                .execute()

            await db
                .insertInto('answer')
                .values(answersWithQuestionId)
                .execute()

            return response.status(201).json({
                id: id,
                question: question,
                answers: answersWithQuestionId,
            });
        } catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao salvar os dados.',
                stack: error,
                local: 'SurgeryRoom.store',
            });
        }
    }

}


export default new QuestionController();
