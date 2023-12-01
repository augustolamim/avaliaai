"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiAuth = void 0;
function apiAuth(request, response, next) {
    const authHeader = request.headers['api-key'];
    if (!authHeader) {
        return response.status(401).json({ message: "Acesso negado 1" });
    }
    try {
        const apiKey = process.env.API_KEY;
        if (apiKey !== authHeader) {
            return response.status(401).json({ message: "Acesso negado 2" });
        }
        next();
    }
    catch (err) {
        return response.status(400).json({ message: 'Acesso negado 3' });
    }
}
exports.apiAuth = apiAuth;
