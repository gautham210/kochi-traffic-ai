
import { WeatherData, WeatherCondition } from '../types/trafficTypes';

export class WeatherService {

    getWeatherForJunction(junctionId: string): WeatherData {
        // Mock data that could rotate based on time/randomness
        // For hackathon, we can return consistent but realistic data

        return {
            temperature: 28 + Math.random() * 2,
            humidity: 75 + Math.random() * 5,
            aqi: 40 + Math.random() * 20,
            condition: this.getRandomCondition()
        };
    }

    private getRandomCondition(): WeatherCondition {
        const r = Math.random();
        if (r > 0.8) return 'Rainy';
        if (r > 0.6) return 'Cloudy';
        return 'Sunny';
    }
}

export const weatherService = new WeatherService();
