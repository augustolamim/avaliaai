import { Router } from "express";
import { apiAuth } from './middlewares/auth';
import GradeController from "./controllers/GradeController";
import QuestionController from "./controllers/QuestionController";


const routes = Router();

routes.use(apiAuth);
routes.post('/api/grade/:id', GradeController.store)
routes.post('/api/question/create', QuestionController.store)
routes.put('/api/question/update/:id', QuestionController.update)
routes.get('/api/question/all', QuestionController.index)
routes.get('/api/question/show/:id', QuestionController.show)


export default routes;
