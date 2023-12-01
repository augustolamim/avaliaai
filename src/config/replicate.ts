import Replicate from "replicate";
import 'dotenv/config';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export default replicate