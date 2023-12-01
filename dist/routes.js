"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("./middlewares/auth");
const GradeController_1 = __importDefault(require("./controllers/GradeController"));
const QuestionController_1 = __importDefault(require("./controllers/QuestionController"));
const routes = (0, express_1.Router)();
routes.use(auth_1.apiAuth);
routes.post('/api/grade/:id', GradeController_1.default.store);
routes.post('/api/question/create', QuestionController_1.default.store);
routes.put('/api/question/update/:id', QuestionController_1.default.update);
routes.get('/api/question/all', QuestionController_1.default.index);
routes.get('/api/question/show/:id', QuestionController_1.default.show);
exports.default = routes;
