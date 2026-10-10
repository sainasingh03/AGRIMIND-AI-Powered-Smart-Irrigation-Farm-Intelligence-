from fastapi import FastAPI
from pydantic import BaseModel

from environment import IrrigationEnvironment
from agent import QLearningAgent
from train import train_agent


app = FastAPI(
    title="AgriMind AI",
    description="Smart Irrigation using MDP and Q-Learning",
    version="1.0"
)


ACTIONS = [
    "NO_WATER",
    "LOW_WATER",
    "MEDIUM_WATER",
    "HIGH_WATER"
]


print("Training AI agent...")

agent, rewards = train_agent(1000)

agent.epsilon = 0

environment = IrrigationEnvironment()


class FarmData(BaseModel):

    soil_moisture: float
    temperature: float
    humidity: float
    rain_probability: float


@app.get("/")
def home():

    return {
        "message": "🌾 AgriMind AI is running",
        "model": "MDP + Q-Learning"
    }


@app.post("/predict")
def predict(data: FarmData):

    environment.soil_moisture = data.soil_moisture
    environment.temperature = data.temperature
    environment.humidity = data.humidity
    environment.rain_probability = data.rain_probability

    state = environment.get_state()

    action = agent.choose_action(state)

    return {

        "state": state,

        "decision": action,

        "soil_moisture": data.soil_moisture,

        "temperature": data.temperature,

        "humidity": data.humidity,

        "rain_probability": data.rain_probability

    }