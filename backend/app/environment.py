import random


class IrrigationEnvironment:

    def __init__(self):
        self.soil_moisture = 50
        self.temperature = 30
        self.humidity = 50
        self.rain_probability = 20

    def reset(self):
        self.soil_moisture = random.randint(30, 70)
        self.temperature = random.randint(20, 40)
        self.humidity = random.randint(30, 80)
        self.rain_probability = random.randint(0, 100)

        return self.get_state()

    def get_state(self):

        # Convert continuous values into discrete states

        if self.soil_moisture < 30:
            moisture = "dry"

        elif self.soil_moisture < 70:
            moisture = "normal"

        else:
            moisture = "wet"

        if self.temperature < 25:
            temperature = "low"

        elif self.temperature < 35:
            temperature = "normal"

        else:
            temperature = "high"

        if self.rain_probability < 30:
            rain = "low"

        elif self.rain_probability < 70:
            rain = "medium"

        else:
            rain = "high"

        return (
            moisture,
            temperature,
            rain
        )

    def step(self, action):

        water_amount = {
            "NO_WATER": 0,
            "LOW_WATER": 10,
            "MEDIUM_WATER": 25,
            "HIGH_WATER": 40
        }

        water = water_amount[action]

        # Natural moisture loss
        self.soil_moisture -= random.uniform(2, 6)

        # Irrigation
        self.soil_moisture += water * 0.8

        # Rain
        if random.random() < self.rain_probability / 100:
            self.soil_moisture += random.uniform(5, 20)

        # Keep moisture realistic
        self.soil_moisture = max(
            0,
            min(100, self.soil_moisture)
        )

        reward = self.calculate_reward(
            water,
            self.soil_moisture
        )

        next_state = self.get_state()

        return next_state, reward

    def calculate_reward(self, water, moisture):

        reward = 0

        # Healthy moisture range
        if 40 <= moisture <= 70:
            reward += 20

        # Too dry
        elif moisture < 30:
            reward -= 30

        # Too wet
        elif moisture > 85:
            reward -= 20

        # Water usage penalty
        reward -= water * 0.3

        # Don't waste water if rain is likely
        if self.rain_probability > 70 and water > 0:
            reward -= 20

        return reward