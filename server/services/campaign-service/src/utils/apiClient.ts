import axios from 'axios';
import config from '../config';

export const botServiceClient = axios.create({
    baseURL: config.botServiceUrl,
    headers: { 'x-internal-secret': config.internalSecret }
});
