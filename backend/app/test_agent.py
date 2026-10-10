from environment import IrrigationEnvironment
from agent import QLearningAgent
from train import train_agent


agent, rewards = train_agent(1000)

environment = IrrigationEnvironment()

agent.epsilon = 0

state = environment.reset()

print("\n🌾 CURRENT FIELD")

print("Soil Moisture:", environment.soil_moisture)
print("Temperature:", environment.temperature)
print("Humidity:", environment.humidity)
print("Rain Probability:", environment.rain_probability)

print("\nMDP State:", state)

action = agent.choose_action(state)

print("\n🤖 AI DECISION:", action)

next_state, reward = environment.step(action)

print("\nReward:", reward)

print("New Soil Moisture:", environment.soil_moisture)