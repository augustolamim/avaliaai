import { Response, NextFunction, Request } from 'express'


export function apiAuth(request: Request, response: Response, next: NextFunction) {
    const authHeader = request.headers['api-key']

    if (!authHeader) {
        return response.status(401).json({ message: "Acesso negado 1" })
    }
    try {
        const apiKey = process.env.API_KEY as string
        if (apiKey !== authHeader) {
            return response.status(401).json({ message: "Acesso negado 2" })
        }

        next()
    } catch (err) {
        return response.status(400).json({ message: 'Acesso negado 3' })
    }
}