import { Response, Request } from 'express'
import * as Yup from 'yup';
import { db } from '../database';
import replicate from '../config/replicate';

class GradeController {
    async store(request: Request, response: Response) {

        try {
            const schema = Yup.object().shape({
                answer: Yup.string().required()
            });

            try {
                await schema.validate(request.body, { abortEarly: false });
            } catch (validationError: any) {
                console.log(typeof validationError)
                return response.status(400).json({ errors: validationError.errors });
            }
            const { answer }: { answer: string } = request.body;
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
                .selectAll()
                .execute()
            const prompt = "<|system|>Based on this array of answers with scores and feedbacks" + JSON.stringify(answers) + "generate a score and feedback for this new answer:\"" + answer + "\" DO NOT send anything other then a number for the score and the feedback, dont need text like score: or this is the feedback: </s>"

            let i = 0
            while (i < 15) {
                console.log("count: " + i)

                const output = await replicate.run(
                    "tomasmcm/zephyr-7b-beta:961cd6665b811d0c43c0b9488b6dfa85ff5c7bfb875e93b4533e4c7f96c7c526",
                    {
                        input: {
                            top_k: 50,
                            top_p: 0.95,
                            prompt: prompt,
                            temperature: 0.8,
                            max_new_tokens: 128,
                            presence_penalty: 1
                        }
                    }
                );
                const outputstring: any = output
                const regex = /Score: (\d+)[\s\S]*?Feedback: ([^\n]+)/;;
                console.log(output)
                const match = outputstring.match(regex);
                if (match) {
                    const score = parseInt(match[1], 10); // Convert the matched score to an integer
                    const feedback = match[2];


                    return response.status(201).json({
                        score, feedback
                    });
                }

                i++
            }

            // Check if there is a match           

            return response.status(400).json({
                message: "bad request"
            })

        } catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao salvar os dados.',
                stack: error,
                local: 'Checklist.update',
            });
        }
    }
}

export default new GradeController();
