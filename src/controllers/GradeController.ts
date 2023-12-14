import { Response, Request } from 'express'
import * as Yup from 'yup';
import { db } from '../database';
import OpenAI from 'openai'
import replicate from '../config/replicate';
const translatte = require('translatte')
const natural = require('natural');
const aposToLexForm = require('apos-to-lex-form');
const SpellCorrector = require('spelling-corrector');
const SW = require('stopword');


const openai = new OpenAI({
    apiKey: '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',
})

const spellCorrector = new SpellCorrector();
spellCorrector.loadDictionary();
const getSentiment = (output: any): number => {
    const lexedReview = aposToLexForm(output);
    const casedReview = lexedReview.toLowerCase();
    const alphaOnlyReview = casedReview.replace(/[^a-zA-Z\s]+/g, '');

    const { WordTokenizer } = natural;
    const tokenizer = new WordTokenizer();
    const tokenizedReview = tokenizer.tokenize(alphaOnlyReview);

    tokenizedReview.forEach((word: any, index: any) => {
        tokenizedReview[index] = spellCorrector.correct(word);
    })
    const filteredReview = SW.removeStopwords(tokenizedReview);

    const { SentimentAnalyzer, PorterStemmer } = natural;
    const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');

    return analyzer.getSentiment(filteredReview)
}
class GradeController {
    async zypher(request: Request, response: Response) {

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
            const answersToEnglish = await translatte(JSON.stringify(answers), { to: 'en' })
            //  console.log('answers to english: ' + answersToEnglish.text + "\n")
            const answerToEnglish = await translatte(JSON.stringify(answer), { to: 'en' })
            console.log(answerToEnglish.text)
            // console.log('answer to english: ' + answerToEnglish.text + "\n")
            const questionToEnglish = await translatte(question[0].question, { to: 'en' })
            //  console.log('question to english: ' + questionToEnglish.text + "\n")

            const GrammarCheck = "<|user|>From now on you will answer all questions with Yes or No. Dont add any other explanation or comments to your answer. Is the grammar in this text good? text: \"" + answerToEnglish.text + "\"</user>"
            let j = 0
            let GrammarCheckArray: number[] = []
            while (j < 10) {
                const output = await replicate.run(
                    "tomasmcm/zephyr-7b-beta:961cd6665b811d0c43c0b9488b6dfa85ff5c7bfb875e93b4533e4c7f96c7c526",
                    {
                        input: {
                            top_k: 50,
                            top_p: 0.95,
                            prompt: GrammarCheck,
                            temperature: 0.8,
                            max_new_tokens: 128,
                            presence_penalty: 1
                        }
                    }
                );

                GrammarCheckArray.push(getSentiment(output))
                j++
            }
            const avarageGrammarCheck = GrammarCheckArray.reduce((a, b) => a + b, 0) / GrammarCheckArray.length

            let grammarCheck = 'Boa'
            if (avarageGrammarCheck < 0) {
                grammarCheck = 'Ruim'
            }
            const prompt = "<|system|>Based on this array of answers with scores and feedbacks" + answersToEnglish.text + "generate a score and feedback for this new answer:\"" + answerToEnglish.text + "\" to the question:\"" + questionToEnglish.text + "\" DO NOT send anything other then a number for the score and the feedback, dont need text like score: or this is the feedback: </s>"

            let i = 0
            while (i < 10) {
                //console.log("count: " + i)

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

                const match = outputstring.match(regex);
                if (match) {
                    const score = parseInt(match[1], 10); // Convert the matched score to an integer
                    const feedback = match[2];
                    const feedbackToPortuguese: any = await translatte(feedback, { to: 'pt' })
                    const returnFeedback = feedbackToPortuguese.text
                    const newLog = await db
                        .insertInto('log')
                        .values({
                            text: answer,
                            feedback: returnFeedback,
                            model: 'zypher',
                            score: score,
                            question_id: id,
                        })
                        .execute()
                    return response.status(201).json({
                        score, feedback: returnFeedback, grammar: grammarCheck
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
    async chatgpt(request: Request, response: Response) {

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
            const answersToEnglish = await translatte(JSON.stringify(answers), { to: 'en' })
            //  console.log('answers to english: ' + answersToEnglish.text + "\n")
            const answerToEnglish = await translatte(JSON.stringify(answer), { to: 'en' })
            console.log(answerToEnglish.text)
            // console.log('answer to english: ' + answerToEnglish.text + "\n")
            const questionToEnglish = await translatte(question[0].question, { to: 'en' })
            //  console.log('question to english: ' + questionToEnglish.text + "\n")


            const prompt = "Based on this array of answers with scores and feedbacks" + answersToEnglish.text + "generate a score and feedback for this new answer:\"" + answerToEnglish.text + "\" to the question:\"" + questionToEnglish.text + "\" DO NOT send anything other then a number for the score and the feedback, dont need text like score: or this is the feedback"

            let i = 0
            while (i < 10) {
                console.log("count: " + i)

                const chatCompletion: any = await openai.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'gpt-3.5-turbo',
                })
                const outputstring: any = chatCompletion.choices[0].message.content
                const regex = /Score: (\d+)[\s\S]*?Feedback: ([^\n]+)/;;
                const price = 0.0000010 * chatCompletion.usage.total_tokens * 4.9
                const match = outputstring.match(regex);
                if (match) {
                    const score = parseInt(match[1], 10); // Convert the matched score to an integer
                    const feedback = match[2];
                    const feedbackToPortuguese: any = await translatte(feedback, { to: 'pt' })
                    const returnFeedback = feedbackToPortuguese.text
                    const newLog = await db
                        .insertInto('log')
                        .values({
                            text: answer,
                            feedback: returnFeedback,
                            score: score,
                            model: 'chatgpt',
                            question_id: id,
                        })
                        .execute()
                    return response.status(201).json({
                        score, feedback: returnFeedback, tokenAmount: chatCompletion.usage.total_tokens, price
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
    async yi(request: Request, response: Response) {

        // try {
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
        const answersToEnglish = await translatte(JSON.stringify(answers), { to: 'en' })
        //  console.log('answers to english: ' + answersToEnglish.text + "\n")
        const answerToEnglish = await translatte(JSON.stringify(answer), { to: 'en' })
        console.log(answerToEnglish.text)
        // console.log('answer to english: ' + answerToEnglish.text + "\n")
        const questionToEnglish = await translatte(question[0].question, { to: 'en' })
        //  console.log('question to english: ' + questionToEnglish.text + "\n")

        const prompt = "<|system|>Based on this array of answers with scores and feedbacks" + answersToEnglish.text + "generate a score and feedback for this new answer:\"" + answerToEnglish.text + "\" to the question:\"" + questionToEnglish.text + "\" DO NOT send anything other then a number for the score and the feedback, dont need text like score: or this is the feedback: </s>"

        let i = 0
        while (i < 10) {
            console.log("count: " + i)

            const output = await replicate.run(
                "01-ai/yi-34b-chat:914692bbe8a8e2b91a4e44203e70d170c9c5ccc1359b283c84b0ec8d47819a46",
                {
                    input: {
                        top_k: 50,
                        top_p: 0.95,
                        prompt: prompt,
                        temperature: 0.3,
                        max_new_tokens: 128,
                        repetition_penalty: 1.2
                    }
                }
            );
            console.log(output)
            const outputstring: any = output
            const regex = /Score: (\d+)[\s\S]*?Feedback: ([^\n]+)/;;

            const match = outputstring.match(regex);
            if (match) {
                const score = parseInt(match[1], 10); // Convert the matched score to an integer
                const feedback = match[2];
                const feedbackToPortuguese: any = await translatte(feedback, { to: 'pt' })
                const returnFeedback = feedbackToPortuguese.text
                return response.status(201).json({
                    score, feedback: returnFeedback
                });
            }

            i++
        }

        // Check if there is a match           

        return response.status(400).json({
            message: "bad request"
        })

        //  } catch (error) {
        //     return response.status(500).json({
        //         error: 'Ocorreu um erro ao salvar os dados.',
        //         stack: error,
        //          local: 'Checklist.update',
        //     });
        //   }
    }
}

export default new GradeController();
